import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';
import { getEscrowStatus, isEscrowEnabled, taskIdToBytes32 } from '../services/escrow/escrowService.js';
import { prisma } from '../config/database.js';
import { sendSuccess } from '../utils/response.js';
import { NotFoundError } from '../utils/errors.js';

const router = Router();

router.use(authenticate);

/**
 * GET /v1/escrow/:taskId
 * Returns BOTH on-chain and off-chain escrow status so the UI never gets confused.
 */
router.get('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { taskId } = req.params;

    // ── Off-chain status (always available) ──
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            platformFee: true,
            totalAmount: true,
            escrowStatus: true,
            onchainTxHash: true,
            fundedAt: true,
            releasedAt: true,
            refundedAt: true,
          },
        },
      },
    });

    if (!task) throw new NotFoundError('Task', taskId);

    const offchain = task.payment
      ? {
          status: task.payment.escrowStatus,
          amount: task.payment.amount,
          platformFee: task.payment.platformFee,
          totalAmount: task.payment.totalAmount,
          txHash: task.payment.onchainTxHash,
          fundedAt: task.payment.fundedAt,
          releasedAt: task.payment.releasedAt,
          refundedAt: task.payment.refundedAt,
        }
      : null;

    // ── On-chain status (if escrow is configured) ──
    let onchain = null;
    if (isEscrowEnabled()) {
      try {
        onchain = await getEscrowStatus(taskId);
      } catch {
        // Contract may not have this task funded yet — that's OK
        onchain = { status: 'EMPTY', error: 'Not funded on-chain' };
      }
    }

    // ── Derived settlement state for UI ──
    let settlementState: 'not_configured' | 'not_funded' | 'funded' | 'pending' | 'confirmed' | 'failed' | 'refunded';

    if (!isEscrowEnabled()) {
      settlementState = 'not_configured';
    } else if (!onchain || onchain.status === 'EMPTY') {
      settlementState = 'not_funded';
    } else if (onchain.status === 'FUNDED') {
      // Check if off-chain already marked as released but on-chain still FUNDED
      if (offchain?.status === 'RELEASED') {
        settlementState = 'pending'; // off-chain approved but on-chain hasn't settled yet
      } else {
        settlementState = 'funded';
      }
    } else if (onchain.status === 'RELEASED') {
      settlementState = 'confirmed';
    } else if (onchain.status === 'REFUNDED') {
      settlementState = 'refunded';
    } else {
      settlementState = 'not_funded';
    }

    sendSuccess(res, {
      data: {
        taskId,
        bytes32Id: taskIdToBytes32(taskId),
        escrowEnabled: isEscrowEnabled(),
        settlementState, // THE key field for UI rendering
        offchain,
        onchain,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
