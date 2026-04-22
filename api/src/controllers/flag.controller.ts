import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';

export async function createFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { taskId, flaggedUserId, reason, details } = req.body;

    if (!taskId && !flaggedUserId) {
      throw new ValidationError('Must flag either a task or a user');
    }

    const validReasons = [
      'ILLEGAL_ACTIVITY', 'HARASSMENT', 'IMPERSONATION', 'FRAUD',
      'PRIVACY_VIOLATION', 'COERCION', 'STALKING', 'SOCIAL_ENGINEERING', 'OTHER',
    ];
    if (!validReasons.includes(reason)) {
      throw new ValidationError(`Invalid reason. Must be one of: ${validReasons.join(', ')}`);
    }

    // Verify target exists
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task) throw new NotFoundError('Task', taskId);
    }
    if (flaggedUserId) {
      const user = await prisma.user.findUnique({ where: { id: flaggedUserId } });
      if (!user) throw new NotFoundError('User', flaggedUserId);
    }

    const flag = await prisma.moderationFlag.create({
      data: {
        taskId,
        flaggedUserId,
        reporterId: userId,
        reason,
        details,
      },
    });

    await createAuditLog({
      action: 'FLAG_CREATED',
      actorId: userId,
      entityType: taskId ? 'task' : 'user',
      entityId: taskId || flaggedUserId,
      metadata: { flagId: flag.id, reason },
    }, req);

    sendCreated(res, flag);
  } catch (err) {
    next(err);
  }
}

export async function listFlags(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const resolved = req.query.resolved === 'true';

    const flags = await prisma.moderationFlag.findMany({
      where: { isResolved: resolved },
      orderBy: { createdAt: 'desc' },
      include: {
        task: { select: { id: true, title: true, status: true } },
        flaggedUser: { select: { id: true, name: true, email: true } },
      },
    });

    sendSuccess(res, { data: flags });
  } catch (err) {
    next(err);
  }
}

export async function resolveFlag(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { resolution } = req.body;

    const flag = await prisma.moderationFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundError('Flag', id);
    if (flag.isResolved) throw new ValidationError('Flag is already resolved');

    const updated = await prisma.moderationFlag.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedById: userId,
        resolvedAt: new Date(),
        resolution,
      },
    });

    await createAuditLog({
      action: 'FLAG_RESOLVED',
      actorId: userId,
      entityType: 'flag',
      entityId: id,
      metadata: { resolution },
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}
