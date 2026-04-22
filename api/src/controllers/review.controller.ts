import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { releaseEscrow, isEscrowEnabled, type SettlementResult } from '../services/escrow/escrowService.js';
import { logger } from '../config/logger.js';

/**
 * Approve task — atomic DB transaction prevents double-settlement.
 * 1. Lock task row via $transaction
 * 2. Validate status === UNDER_REVIEW
 * 3. Update all DB state
 * 4. Attempt on-chain release (idempotent)
 * 5. Store tx hash
 */
export async function approveTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    // ── Atomic DB transaction (serializable isolation prevents races) ──
    const result = await prisma.$transaction(async (tx) => {
      // Read with implicit row-level lock inside transaction
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { payment: true },
      });

      if (!task) throw new NotFoundError('Task', taskId);
      if (task.requesterId !== userId) throw new ForbiddenError('Only the requester can approve');
      if (task.status !== 'UNDER_REVIEW') {
        throw new ValidationError(
          task.status === 'COMPLETED'
            ? 'Task is already approved'
            : 'Task must be under review to approve'
        );
      }

      // Transition to COMPLETED
      const updated = await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          statusHistory: {
            push: { status: 'COMPLETED', timestamp: new Date().toISOString(), actorId: userId },
          },
        },
      });

      // Mark escrow as RELEASING (pending on-chain)
      if (task.payment) {
        await tx.taskPayment.update({
          where: { id: task.payment.id },
          data: {
            escrowStatus: 'RELEASED',
            releasedAt: new Date(),
          },
        });
      }

      // Update executor stats
      if (task.executorId) {
        await tx.user.update({
          where: { id: task.executorId },
          data: {
            tasksCompleted: { increment: 1 },
            totalEarned: { increment: task.budget },
          },
        });
      }

      // Update requester stats
      await tx.user.update({
        where: { id: task.requesterId },
        data: { totalSpent: { increment: task.totalCost } },
      });

      return { updated, task };
    });

    // ── On-chain settlement (outside DB tx — idempotent) ──
    let settlement: SettlementResult | null = null;
    if (isEscrowEnabled() && result.task.executorId) {
      try {
        const executorWallet = await prisma.walletConnection.findFirst({
          where: { userId: result.task.executorId },
          select: { walletAddress: true },
        });
        if (executorWallet) {
          settlement = await releaseEscrow(taskId, executorWallet.walletAddress);
          if (settlement.txHash) {
            await prisma.taskPayment.update({
              where: { taskId },
              data: { onchainTxHash: settlement.txHash },
            });
          }
        } else {
          logger.warn({ taskId }, 'Executor has no linked wallet — skipping on-chain release');
        }
      } catch (err: any) {
        logger.error({ taskId, error: err.message }, 'On-chain release failed — off-chain status still updated');
      }
    }

    await createAuditLog({
      action: 'TASK_APPROVED',
      actorId: userId,
      entityType: 'task',
      entityId: taskId,
      metadata: {
        settlement: settlement?.outcome || 'off-chain-only',
        txHash: settlement?.txHash,
      },
    }, req);

    sendSuccess(res, {
      data: {
        ...result.updated,
        settlement: {
          outcome: settlement?.outcome || 'off-chain-only',
          txHash: settlement?.txHash || null,
          onchainStatus: settlement?.onchainStatus || null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function disputeTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const { reason, evidence } = req.body;

    if (!reason || reason.length < 20) {
      throw new ValidationError('Dispute reason must be at least 20 characters');
    }

    // ── Atomic DB transaction ──
    const dispute = await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { payment: true },
      });

      if (!task) throw new NotFoundError('Task', taskId);
      if (task.requesterId !== userId) throw new ForbiddenError('Only the requester can dispute');
      if (task.status !== 'UNDER_REVIEW') {
        throw new ValidationError(
          task.status === 'DISPUTED'
            ? 'Task is already disputed'
            : 'Task must be under review to dispute'
        );
      }

      const dispute = await tx.taskDispute.create({
        data: { taskId, filerId: userId, reason, evidence },
      });

      await tx.task.update({
        where: { id: taskId },
        data: {
          status: 'DISPUTED',
          statusHistory: {
            push: { status: 'DISPUTED', timestamp: new Date().toISOString(), actorId: userId },
          },
        },
      });

      if (task.payment) {
        await tx.taskPayment.update({
          where: { id: task.payment.id },
          data: { escrowStatus: 'DISPUTED' },
        });
      }

      return dispute;
    });

    await createAuditLog({
      action: 'TASK_DISPUTED',
      actorId: userId,
      entityType: 'task',
      entityId: taskId,
      metadata: { disputeId: dispute.id, reason },
    }, req);

    sendCreated(res, dispute);
  } catch (err) {
    next(err);
  }
}

export async function submitReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.status !== 'COMPLETED') throw new ValidationError('Can only review completed tasks');

    // Determine who is being reviewed
    let reviewedId: string;
    if (userId === task.requesterId) {
      if (!task.executorId) throw new ValidationError('No executor to review');
      reviewedId = task.executorId;
    } else if (userId === task.executorId) {
      reviewedId = task.requesterId;
    } else {
      throw new ForbiddenError('Only task participants can leave reviews');
    }

    // Check for existing review
    const existing = await prisma.taskReview.findUnique({
      where: { taskId_reviewerId: { taskId, reviewerId: userId } },
    });
    if (existing) throw new ValidationError('You have already reviewed this task');

    const review = await prisma.taskReview.create({
      data: { taskId, reviewerId: userId, reviewedId, rating, comment },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Recalc reviewed user's stats
    const allReviews = await prisma.taskReview.findMany({
      where: { reviewedId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: reviewedId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        ratingCount: allReviews.length,
        trustScore: Math.min(100, 50 + (avgRating - 3) * 15 + Math.min(allReviews.length * 2, 20)),
      },
    });

    await createAuditLog({
      action: 'REVIEW_CREATED',
      actorId: userId,
      entityType: 'task',
      entityId: taskId,
      metadata: { reviewId: review.id, rating },
    }, req);

    sendCreated(res, review);
  } catch (err) {
    next(err);
  }
}

export async function listReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;
    const reviews = await prisma.taskReview.findMany({
      where: { taskId },
      include: {
        reviewer: { select: { id: true, name: true, avatarUrl: true } },
        reviewed: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, { data: reviews });
  } catch (err) {
    next(err);
  }
}
