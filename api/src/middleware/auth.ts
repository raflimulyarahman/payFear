import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError, TokenExpiredError, UserBannedError } from '../utils/errors.js';
import { prisma } from '../config/database.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string | null;
        name: string;
        role: string;
        walletAddress: string | null;
        isBanned: boolean;
      };
    }
  }
}

/**
 * Verifies JWT from Authorization header or cookie.
 * Attaches user object to req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from header or cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new UnauthorizedError();
    }

    // Verify JWT
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError();
      }
      throw new UnauthorizedError('Invalid token');
    }

    // Fetch user from database to get latest state
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        walletAddress: true,
        isBanned: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (user.isBanned) {
      throw new UserBannedError();
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional auth — sets req.user if token exists, but doesn't block.
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await authenticate(req, _res, () => {});
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
}
