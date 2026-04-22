import { Router } from 'express';
import { SiweMessage, generateNonce } from 'siwe';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { ValidationError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { createAuditLog } from '../middleware/auditLogger.js';

const router = Router();

// In-memory nonce store (swap for Redis in production)
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();

/**
 * GET /v1/siwe/nonce — get a fresh nonce for SIWE
 */
router.get('/nonce', (_req: Request, res: Response) => {
  const nonce = generateNonce();
  // Store nonce for 5 minutes
  nonceStore.set(nonce, { nonce, expiresAt: Date.now() + 5 * 60 * 1000 });

  // Clean expired entries
  for (const [key, val] of nonceStore) {
    if (val.expiresAt < Date.now()) nonceStore.delete(key);
  }

  sendSuccess(res, { data: { nonce } });
});

/**
 * POST /v1/siwe/verify — verify a SIWE signature and issue JWT
 * Body: { message: string, signature: string }
 *
 * If the wallet is already linked to a user, returns that user's JWT.
 * If the wallet is unknown, creates a new user (wallet-first onboarding).
 */
router.post('/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, signature } = req.body;

    if (!message || !signature) {
      throw new ValidationError('Message and signature are required');
    }

    // Parse and verify SIWE message
    const siweMessage = new SiweMessage(message);
    const { data: verified } = await siweMessage.verify({ signature });

    // Validate nonce
    const stored = nonceStore.get(verified.nonce);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new ValidationError('Invalid or expired nonce');
    }
    nonceStore.delete(verified.nonce); // single-use

    // Validate domain
    if (verified.domain !== env.SIWE_DOMAIN && env.NODE_ENV !== 'development') {
      throw new ValidationError('Domain mismatch');
    }

    const walletAddress = verified.address.toLowerCase();

    // Find or create user by wallet
    let user = await prisma.user.findFirst({
      where: { walletAddress },
    });

    if (!user) {
      // Check WalletConnection table too
      const walletConn = await prisma.walletConnection.findFirst({
        where: { walletAddress, isActive: true },
      });

      if (walletConn) {
        user = await prisma.user.findUnique({ where: { id: walletConn.userId } });
      }
    }

    if (!user) {
      // Wallet-first onboarding — create new user
      user = await prisma.user.create({
        data: {
          name: `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          walletAddress,
          walletLinkedAt: new Date(),
          isVerified: true,
        },
      });

      // Create wallet connection
      await prisma.walletConnection.create({
        data: {
          userId: user.id,
          walletAddress,
          chainId: verified.chainId || 84532,
        },
      });

      logger.info({ userId: user.id, walletAddress }, 'SIWE: new user created via wallet');
    }

    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await createAuditLog({
      action: 'USER_WALLET_LINKED',
      actorId: user.id,
      entityType: 'auth',
      entityId: user.id,
      metadata: { method: 'siwe', walletAddress },
    }, req);

    sendSuccess(res, {
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          walletAddress: user.walletAddress,
          role: user.role,
          avatarUrl: user.avatarUrl,
          rating: user.rating,
          trustScore: user.trustScore,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
