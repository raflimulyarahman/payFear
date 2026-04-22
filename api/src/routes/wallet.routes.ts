import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';

const router = Router();

router.use(authenticate);

/**
 * GET /v1/wallet — list user's linked wallets
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallets = await prisma.walletConnection.findMany({
      where: { userId: req.user!.id },
      orderBy: { connectedAt: 'desc' },
    });
    sendSuccess(res, { data: wallets });
  } catch (err) { next(err); }
});

/**
 * POST /v1/wallet/link — link a wallet address
 * Body: { walletAddress: string, chainId?: number }
 */
router.post('/link', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { walletAddress, chainId = 84532 } = req.body;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new ValidationError('Invalid Ethereum address');
    }

    const normalized = walletAddress.toLowerCase();

    // Check if already linked by another user
    const existing = await prisma.walletConnection.findFirst({
      where: { walletAddress: normalized, userId: { not: userId } },
    });
    if (existing) {
      throw new ValidationError('This wallet is already linked to another account');
    }

    const wallet = await prisma.walletConnection.upsert({
      where: { userId_walletAddress: { userId, walletAddress: normalized } },
      update: { isActive: true, chainId },
      create: { userId, walletAddress: normalized, chainId },
    });

    // Also update user's primary wallet
    await prisma.user.update({
      where: { id: userId },
      data: { walletAddress: normalized, walletLinkedAt: new Date() },
    });

    await createAuditLog({
      action: 'USER_WALLET_LINKED',
      actorId: userId,
      entityType: 'wallet',
      entityId: wallet.id,
      metadata: { walletAddress: normalized, chainId },
    }, req);

    sendCreated(res, wallet);
  } catch (err) { next(err); }
});

/**
 * DELETE /v1/wallet/:id — unlink a wallet
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const wallet = await prisma.walletConnection.findUnique({ where: { id: req.params.id } });

    if (!wallet) throw new NotFoundError('Wallet', req.params.id);
    if (wallet.userId !== userId) throw new ForbiddenError('Not your wallet');

    await prisma.walletConnection.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });

    // Clear primary wallet if it matches
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.walletAddress === wallet.walletAddress) {
      await prisma.user.update({
        where: { id: userId },
        data: { walletAddress: null, walletLinkedAt: null },
      });
    }

    sendSuccess(res, { data: { id: req.params.id, unlinked: true } });
  } catch (err) { next(err); }
});

export default router;
