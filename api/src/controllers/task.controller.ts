import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError, ContentBlockedError, AppError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { buildPrismaSkipTake, buildPaginationMeta } from '../utils/pagination.js';
import { runSafetyCheck } from '../services/safety/safetyEngine.js';
import type { CreateTaskInput, ListTasksInput } from '../validators/task.schema.js';
import type { Prisma } from '@prisma/client';

const PLATFORM_FEE_RATE = 0.05; // 5%
const URGENCY_FEE_RATE = 0.20; // 20%

export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const input = req.body as CreateTaskInput;
    const userId = req.user!.id;

    const platformFee = input.budget * PLATFORM_FEE_RATE;
    const urgencyFee = input.urgency === 'urgent' ? input.budget * URGENCY_FEE_RATE : 0;
    const totalCost = input.budget + platformFee + urgencyFee;

    // Run safety check
    const safety = runSafetyCheck({
      title: input.title,
      description: input.description,
      category: input.category,
    });

    if (!safety.passed) {
      throw new ContentBlockedError(safety.blockedReasons);
    }

    // Accept both proofTypes (array) and proofType (single) from frontend
    const resolvedProofType = input.proofTypes?.[0] || input.proofType || 'SCREENSHOT';

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        category: input.category,
        location: input.location,
        address: input.address,
        budget: input.budget,
        platformFee,
        urgencyFee,
        totalCost,
        deadline: new Date(input.deadline),
        urgency: input.urgency,
        proofType: resolvedProofType,
        specialInstructions: input.specialInstructions,
        riskLevel: safety.riskLevel,
        riskFlags: safety.flags.concat(safety.blockedReasons),
        status: 'DRAFT',
        requesterId: userId,
      },
    });

    await createAuditLog({
      action: 'TASK_CREATED',
      actorId: userId,
      entityType: 'task',
      entityId: task.id,
    }, req);

    sendCreated(res, task);
  } catch (err) {
    next(err);
  }
}

export async function listTasks(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = (req.validated?.query ?? req.query) as unknown as ListTasksInput;
    const { skip, take } = buildPrismaSkipTake(query);

    // Build where clause
    const where: Prisma.TaskWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else {
      // Default: show only open tasks for browsing
      where.status = 'OPEN';
    }

    if (query.category) where.category = query.category;
    if (query.risk) where.riskLevel = query.risk;
    if (query.location) where.location = query.location;

    if (query.minBudget || query.maxBudget) {
      where.budget = {};
      if (query.minBudget) where.budget.gte = query.minBudget;
      if (query.maxBudget) where.budget.lte = query.maxBudget;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Build order
    const orderBy: Prisma.TaskOrderByWithRelationInput = (() => {
      switch (query.sort) {
        case 'oldest': return { createdAt: 'asc' };
        case 'budget_high': return { budget: 'desc' };
        case 'budget_low': return { budget: 'asc' };
        case 'deadline': return { deadline: 'asc' };
        default: return { createdAt: 'desc' };
      }
    })();

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          location: true,
          budget: true,
          totalCost: true,
          deadline: true,
          urgency: true,
          proofType: true,
          riskLevel: true,
          status: true,
          createdAt: true,
          requester: {
            select: { id: true, name: true, avatarUrl: true, rating: true },
          },
          executor: {
            select: { id: true, name: true, avatarUrl: true, rating: true },
          },
        },
      }),
      prisma.task.count({ where }),
    ]);

    sendPaginated(res, tasks, buildPaginationMeta(query.page, query.limit, total));
  } catch (err) {
    next(err);
  }
}

export async function getTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, avatarUrl: true, rating: true, ratingCount: true },
        },
        executor: {
          select: { id: true, name: true, avatarUrl: true, rating: true, ratingCount: true },
        },
        proofs: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            proofType: true,
            textContent: true,
            fileUrl: true,
            fileName: true,
            notes: true,
            createdAt: true,
            submittedBy: { select: { id: true, name: true } },
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        disputes: {
          select: {
            id: true,
            reason: true,
            status: true,
            resolution: true,
            createdAt: true,
            filer: { select: { id: true, name: true } },
          },
        },
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
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundError('Task', id);
    }

    sendSuccess(res, { data: task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.requesterId !== userId) throw new ForbiddenError('Not your task');
    if (task.status !== 'DRAFT') throw new ValidationError('Can only edit draft tasks');

    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
    });

    await createAuditLog({
      action: 'TASK_UPDATED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.requesterId !== userId) throw new ForbiddenError('Not your task');
    if (task.status !== 'DRAFT') throw new ValidationError('Can only delete draft tasks');

    await prisma.task.delete({ where: { id } });
    sendNoContent(res);
  } catch (err) {
    next(err);
  }
}

export async function publishTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.requesterId !== userId) throw new ForbiddenError('Not your task');
    if (task.status !== 'DRAFT') throw new ValidationError('Can only publish draft tasks');
    if (task.riskLevel === 'HIGH') throw new AppError(400, 'CONTENT_BLOCKED', 'Task blocked by safety check');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'OPEN',
        publishedAt: new Date(),
        statusHistory: {
          push: { status: 'OPEN', timestamp: new Date().toISOString(), actorId: userId },
        },
      },
    });

    // Create payment record (escrow pending)
    await prisma.taskPayment.create({
      data: {
        taskId: id,
        amount: task.budget,
        platformFee: task.platformFee,
        urgencyFee: task.urgencyFee,
        totalAmount: task.totalCost,
        escrowStatus: 'PENDING',
      },
    });

    await createAuditLog({
      action: 'TASK_UPDATED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
      metadata: { transition: 'DRAFT -> OPEN' },
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function acceptTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.status !== 'OPEN') throw new ValidationError('Task is not open for acceptance');
    if (task.requesterId === userId) throw new ValidationError('Cannot accept your own task');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        executorId: userId,
        acceptedAt: new Date(),
        statusHistory: {
          push: { status: 'ACCEPTED', timestamp: new Date().toISOString(), actorId: userId },
        },
      },
    });

    await createAuditLog({
      action: 'TASK_ACCEPTED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function startTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);
    if (task.status !== 'ACCEPTED') throw new ValidationError('Task must be accepted first');
    if (task.executorId !== userId) throw new ForbiddenError('Only the assigned executor can start');

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        statusHistory: {
          push: { status: 'IN_PROGRESS', timestamp: new Date().toISOString(), actorId: userId },
        },
      },
    });

    await createAuditLog({
      action: 'TASK_STARTED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}

export async function cancelTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundError('Task', id);

    const cancellableStates = ['DRAFT', 'OPEN', 'ACCEPTED'];
    if (!cancellableStates.includes(task.status)) {
      throw new ValidationError('Task cannot be cancelled in its current state');
    }

    // Only requester or executor (if accepted) can cancel
    const isRequester = task.requesterId === userId;
    const isExecutor = task.executorId === userId;
    if (!isRequester && !isExecutor) {
      throw new ForbiddenError('Only the requester or executor can cancel');
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        statusHistory: {
          push: { status: 'CANCELLED', timestamp: new Date().toISOString(), actorId: userId },
        },
      },
    });

    await createAuditLog({
      action: 'TASK_CANCELLED',
      actorId: userId,
      entityType: 'task',
      entityId: id,
      metadata: { cancelledBy: isRequester ? 'requester' : 'executor' },
    }, req);

    sendSuccess(res, { data: updated });
  } catch (err) {
    next(err);
  }
}
