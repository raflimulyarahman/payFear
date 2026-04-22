import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { createAuditLog } from '../middleware/auditLogger.js';

export async function submitProof(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError('Task', taskId);
    if (task.executorId !== userId) throw new ForbiddenError('Only the assigned executor can submit proofs');
    if (task.status !== 'IN_PROGRESS' && task.status !== 'PROOF_SUBMITTED') {
      throw new ValidationError('Task must be in progress to submit proof');
    }

    const { proofType, textContent, fileUrl, fileName, fileSize, mimeType, notes } = req.body;

    // Validate proof has content
    if (proofType === 'TEXT' && !textContent) {
      throw new ValidationError('Text proof requires textContent');
    }
    if (['SCREENSHOT', 'PHOTO', 'VIDEO'].includes(proofType) && !fileUrl) {
      throw new ValidationError(`${proofType} proof requires a file upload`);
    }

    const proof = await prisma.taskProof.create({
      data: {
        taskId,
        submittedById: userId,
        proofType: proofType || task.proofType,
        textContent,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        notes,
      },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    // Transition task to PROOF_SUBMITTED -> UNDER_REVIEW
    if (task.status === 'IN_PROGRESS') {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'UNDER_REVIEW',
          statusHistory: {
            push: [
              { status: 'PROOF_SUBMITTED', timestamp: new Date().toISOString(), actorId: userId },
              { status: 'UNDER_REVIEW', timestamp: new Date().toISOString(), actorId: 'system' },
            ],
          },
        },
      });
    }

    await createAuditLog({
      action: 'TASK_PROOF_SUBMITTED',
      actorId: userId,
      entityType: 'task',
      entityId: taskId,
      metadata: { proofId: proof.id, proofType: proof.proofType },
    }, req);

    sendCreated(res, proof);
  } catch (err) {
    next(err);
  }
}

export async function listProofs(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { taskId } = req.params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError('Task', taskId);

    const proofs = await prisma.taskProof.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        submittedBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    sendSuccess(res, { data: proofs });
  } catch (err) {
    next(err);
  }
}
