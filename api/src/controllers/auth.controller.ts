import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth/authService.js';
import { authenticate } from '../middleware/auth.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import type { RegisterInput, LoginInput } from '../validators/auth.schema.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const { user, token } = await authService.registerUser(input);

    // Audit log
    await createAuditLog({
      action: 'USER_CREATED',
      actorId: user.id,
      entityType: 'user',
      entityId: user.id,
      metadata: { role: user.role },
    }, req);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendCreated(res, { user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const { user, token } = await authService.loginUser(input);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(res, { data: { user, token } });
  } catch (err) {
    next(err);
  }
}

export async function logout(
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> {
  res.clearCookie('token');
  sendSuccess(res, { data: { message: 'Logged out successfully' } });
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use authenticate middleware inline
    await new Promise<void>((resolve, reject) => {
      authenticate(req, res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const user = await authService.getUserById(req.user!.id);
    sendSuccess(res, { data: user });
  } catch (err) {
    next(err);
  }
}
