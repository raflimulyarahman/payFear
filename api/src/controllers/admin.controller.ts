import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { releaseEscrow, refundEscrow, isEscrowEnabled, getContractStats } from '../services/escrow/escrowService.js';
import { logger } from '../config/logger.js';

export async function getDashboard(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [
      totalUsers,
      totalTasks,
      openTasks,
      activeTasks,
      completedTasks,
      disputedTasks,
      openFlags,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.task.count(),
      prisma.task.count({ where: { status: 'OPEN' } }),
      prisma.task.count({ where: { status: { in: ['ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.task.count({ where: { status: 'COMPLETED' } }),
      prisma.task.count({ where: { status: 'DISPUTED' } }),
      prisma.moderationFlag.count({ where: { isResolved: false } }),
    ]);

    // On-chain stats (if escrow is live)
    let onchain = null;
    if (isEscrowEnabled()) {
      try {
        onchain = await getContractStats();
      } catch { /* not critical */ }
    }

    sendSuccess(res, {
      data: {
        totalUsers,
        totalTasks,
        openTasks,
        activeTasks,
        completedTasks,
        disputedTasks,
        openFlags,
        escrowEnabled: isEscrowEnabled(),
        onchain,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function blockTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.status === 'BLOCKED') throw new ValidationError('Task is already blocked');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'BLOCKED',
        statusHistory: {
          push: { status: 'BLOCKED', timestamp: new Date().toISOString(), actorId: userId },
        },
      },
    });

    await createAuditLog({
      action: 'TASK_BLOCKED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
      metadata: { reason },
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function unblockTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.status !== 'BLOCKED') throw new ValidationError('Task is not blocked');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'OPEN',
        statusHistory: {
          push: { status: 'OPEN', timestamp: new Date().toISOString(), actorId: userId, note: 'Unblocked by admin' },
        },
      },
    });

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function banUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User', id);
    if (user.isBanned) throw new ValidationError('User is already banned');

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: true, bannedReason: reason },
    });

    await createAuditLog({
      action: 'ADMIN_ACTION',
      actorId: userId,
      entityType: 'user',
      entityId: id,
      metadata: { action: 'ban', reason },
    }, req);

    sendSuccess(res, { data: { id: updated.id, name: updated.name, isBanned: true } });
  } catch (err) {
    next(err);
  }
}

export async function unbanUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User', id);
    if (!user.isBanned) throw new ValidationError('User is not banned');

    const updated = await prisma.user.update({
      where: { id },
      data: { isBanned: false, bannedReason: null },
    });

    sendSuccess(res, { data: { id: updated.id, name: updated.name, isBanned: false } });
  } catch (err) {
    next(err);
  }
}

export async function resolveDispute(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { resolution, favorExecutor } = req.body;

    if (!resolution) throw new ValidationError('Resolution text is required');

    const newTaskStatus = favorExecutor ? 'COMPLETED' : 'REFUNDED';
    const newEscrowStatus = favorExecutor ? 'RELEASED' : 'REFUNDED';
    const disputeResolution = favorExecutor ? 'RESOLVED_EXECUTOR' : 'RESOLVED_REQUESTER';

    // ── Atomic DB transaction (prevents double-resolution) ──
    const txResult = await prisma.$transaction(async (tx) => {
      const dispute = await tx.taskDispute.findUnique({
        where: { id },
        include: { task: { include: { payment: true } } },
      });

      if (!dispute) throw new NotFoundError('Dispute', id);
      if (dispute.status !== 'OPEN') {
        throw new ValidationError('Dispute is already resolved');
      }

      await tx.taskDispute.update({
        where: { id },
        data: {
          status: disputeResolution,
          resolution,
          resolvedById: userId,
          resolvedAt: new Date(),
        },
      });

      await tx.task.update({
        where: { id: dispute.taskId },
        data: {
          status: newTaskStatus,
          ...(newTaskStatus === 'COMPLETED' && { completedAt: new Date() }),
          statusHistory: {
            push: {
              status: newTaskStatus,
              timestamp: new Date().toISOString(),
              actorId: userId,
              note: `Dispute resolved: ${disputeResolution}`,
            },
          },
        },
      });

      if (dispute.task.payment) {
        await tx.taskPayment.update({
          where: { id: dispute.task.payment.id },
          data: {
            escrowStatus: newEscrowStatus,
            ...(favorExecutor ? { releasedAt: new Date() } : { refundedAt: new Date() }),
          },
        });
      }

      if (favorExecutor && dispute.task.executorId) {
        await tx.user.update({
          where: { id: dispute.task.executorId },
          data: {
            tasksCompleted: { increment: 1 },
            totalEarned: { increment: dispute.task.budget },
          },
        });
      }

      return dispute;
    });

    // ── On-chain settlement (outside DB tx — idempotent) ──
    let settlementOutcome = 'off-chain-only';
    let txHash: string | null = null;
    let onchainStatus: string | null = null;

    if (txResult.task.payment && isEscrowEnabled()) {
      try {
        if (favorExecutor && txResult.task.executorId) {
          const wallet = await prisma.walletConnection.findFirst({
            where: { userId: txResult.task.executorId },
            select: { walletAddress: true },
          });
          if (wallet) {
            const result = await releaseEscrow(txResult.taskId, wallet.walletAddress);
            settlementOutcome = result.outcome;
            txHash = result.txHash;
            onchainStatus = result.onchainStatus;
          }
        } else {
          const result = await refundEscrow(txResult.taskId);
          settlementOutcome = result.outcome;
          txHash = result.txHash;
          onchainStatus = result.onchainStatus;
        }

        if (txHash) {
          await prisma.taskPayment.update({
            where: { taskId: txResult.taskId },
            data: { onchainTxHash: txHash },
          });
        }
      } catch (err: any) {
        settlementOutcome = 'failed';
        logger.error({ disputeId: id, error: err.message }, 'On-chain settlement failed');
      }
    }

    await createAuditLog({
      action: 'ADMIN_ACTION',
      actorId: userId,
      entityType: 'dispute',
      entityId: id,
      metadata: { resolution, favorExecutor, newTaskStatus, settlementOutcome, txHash },
    }, req);

    sendSuccess(res, {
      data: {
        disputeId: id,
        resolution: disputeResolution,
        taskStatus: newTaskStatus,
        settlement: { outcome: settlementOutcome, txHash, onchainStatus },
      },
    });
  } catch (err) {
    next(err);
  }
}
