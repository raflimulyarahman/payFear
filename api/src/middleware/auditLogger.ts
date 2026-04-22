import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../config/logger.js';

type AuditAction = 
  | 'USER_CREATED' | 'USER_UPDATED' | 'USER_WALLET_LINKED'
  | 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_ACCEPTED' | 'TASK_STARTED'
  | 'TASK_PROOF_SUBMITTED' | 'TASK_APPROVED' | 'TASK_DISPUTED'
  | 'TASK_CANCELLED' | 'TASK_REFUNDED' | 'TASK_BLOCKED'
  | 'ESCROW_CREATED' | 'ESCROW_RELEASED' | 'ESCROW_REFUNDED'
  | 'FLAG_CREATED' | 'FLAG_RESOLVED'
  | 'REVIEW_CREATED' | 'ADMIN_ACTION';

interface AuditEntry {
  action: AuditAction;
  actorId?: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Creates an audit log entry. Fire-and-forget — does not block the request.
 */
export async function createAuditLog(
  entry: AuditEntry,
  req?: Request
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        actorId: entry.actorId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata ?? undefined,
        ipAddress: req?.ip ?? req?.headers['x-forwarded-for']?.toString() ?? null,
        userAgent: req?.headers['user-agent'] ?? null,
      },
    });
  } catch (err) {
    // Audit log failures should never block the request
    logger.error({ err, entry }, 'Failed to create audit log');
  }
}
