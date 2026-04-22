import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';

/**
 * Requires the authenticated user to have one of the specified roles.
 * Must be used AFTER authenticate middleware.
 *
 * Usage: router.get('/admin/flags', authenticate, requireRole('ADMIN'), controller)
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError(`Role '${req.user.role}' is not authorized for this action`));
      return;
    }

    next();
  };
}
