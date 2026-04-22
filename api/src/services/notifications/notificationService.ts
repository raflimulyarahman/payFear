/**
 * NotificationService — stub for email/push notifications.
 *
 * In production, wire up Resend/SendGrid. For now, logs to console.
 * Each method is safe to call fire-and-forget (never throws).
 */

import { logger } from '../../config/logger.js';

type NotifyPayload = {
  userId: string;
  email?: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
};

async function send(payload: NotifyPayload): Promise<void> {
  // TODO: Replace with Resend SDK call
  // import { Resend } from 'resend';
  // const resend = new Resend(env.RESEND_API_KEY);
  // await resend.emails.send({ from: env.EMAIL_FROM, to: payload.email, subject, html: body });

  logger.info({
    to: payload.email || payload.userId,
    subject: payload.subject,
  }, `📧 NOTIFICATION: ${payload.subject}`);
}

// ─── Task Lifecycle Notifications ────────────────

export async function notifyTaskPublished(taskId: string, requesterEmail: string): Promise<void> {
  await send({
    userId: '',
    email: requesterEmail,
    subject: 'Your task is live!',
    body: `Your task has been published and is now visible on the marketplace. Task ID: ${taskId}`,
  });
}

export async function notifyTaskAccepted(taskId: string, requesterEmail: string, executorName: string): Promise<void> {
  await send({
    userId: '',
    email: requesterEmail,
    subject: 'Someone accepted your task!',
    body: `${executorName} has accepted your task (${taskId}). They'll start working on it soon.`,
  });
}

export async function notifyProofSubmitted(taskId: string, requesterEmail: string): Promise<void> {
  await send({
    userId: '',
    email: requesterEmail,
    subject: 'Proof submitted — review needed',
    body: `The executor has submitted proof for task ${taskId}. Please review and approve or dispute.`,
  });
}

export async function notifyTaskApproved(taskId: string, executorEmail: string, amount: number): Promise<void> {
  await send({
    userId: '',
    email: executorEmail,
    subject: 'Task approved — payment released!',
    body: `Great news! Task ${taskId} has been approved. $${amount} has been released to you.`,
  });
}

export async function notifyTaskDisputed(taskId: string, executorEmail: string): Promise<void> {
  await send({
    userId: '',
    email: executorEmail,
    subject: 'Task disputed',
    body: `The requester has disputed task ${taskId}. A moderator will review the case.`,
  });
}

export async function notifyDisputeResolved(
  taskId: string,
  requesterEmail: string,
  executorEmail: string,
  favorExecutor: boolean
): Promise<void> {
  const winner = favorExecutor ? 'executor' : 'requester';
  await send({
    userId: '',
    email: requesterEmail,
    subject: `Dispute resolved — in favor of ${winner}`,
    body: `The dispute for ${taskId} has been resolved in favor of the ${winner}.`,
  });
  await send({
    userId: '',
    email: executorEmail,
    subject: `Dispute resolved — in favor of ${winner}`,
    body: `The dispute for ${taskId} has been resolved in favor of the ${winner}.`,
  });
}

export async function notifySettlementFailed(taskId: string, adminEmail: string, error: string): Promise<void> {
  await send({
    userId: '',
    email: adminEmail,
    subject: `⚠️ On-chain settlement failed for task ${taskId}`,
    body: `The on-chain escrow settlement failed. Error: ${error}. Manual intervention may be required.`,
  });
}

export default {
  notifyTaskPublished,
  notifyTaskAccepted,
  notifyProofSubmitted,
  notifyTaskApproved,
  notifyTaskDisputed,
  notifyDisputeResolved,
  notifySettlementFailed,
};
