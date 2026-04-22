-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('REQUESTER', 'EXECUTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('DRAFT', 'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('PHONE_CALLS', 'SOCIAL', 'RETURN_REFUND', 'NEGOTIATION', 'ADMIN_TASK', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('SCREENSHOT', 'PHOTO', 'TEXT', 'VIDEO');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED_REQUESTER', 'RESOLVED_EXECUTOR', 'ESCALATED');

-- CreateEnum
CREATE TYPE "FlagReason" AS ENUM ('ILLEGAL_ACTIVITY', 'HARASSMENT', 'IMPERSONATION', 'FRAUD', 'PRIVACY_VIOLATION', 'COERCION', 'STALKING', 'SOCIAL_ENGINEERING', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_WALLET_LINKED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_ACCEPTED', 'TASK_STARTED', 'TASK_PROOF_SUBMITTED', 'TASK_APPROVED', 'TASK_DISPUTED', 'TASK_CANCELLED', 'TASK_REFUNDED', 'TASK_BLOCKED', 'ESCROW_CREATED', 'ESCROW_RELEASED', 'ESCROW_REFUNDED', 'FLAG_CREATED', 'FLAG_RESOLVED', 'REVIEW_CREATED', 'ADMIN_ACTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'REQUESTER',
    "bio" TEXT,
    "walletAddress" TEXT,
    "walletLinkedAt" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "tasksCreated" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "bannedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urgencyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "deadline" TIMESTAMP(3) NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "proofType" "ProofType" NOT NULL,
    "specialInstructions" TEXT,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
    "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "TaskStatus" NOT NULL DEFAULT 'DRAFT',
    "statusHistory" JSONB NOT NULL DEFAULT '[]',
    "requesterId" TEXT NOT NULL,
    "executorId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_proofs" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "proofType" "ProofType" NOT NULL,
    "textContent" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_proofs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_payments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "urgencyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "escrowStatus" "EscrowStatus" NOT NULL DEFAULT 'PENDING',
    "onchainTxHash" TEXT,
    "onchainTaskId" TEXT,
    "releaseTxHash" TEXT,
    "refundTxHash" TEXT,
    "fundedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_reviews" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_disputes" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "filerId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_flags" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "flaggedUserId" TEXT,
    "reporterId" TEXT NOT NULL,
    "reason" "FlagReason" NOT NULL,
    "details" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moderation_flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "actorId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'base',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_walletAddress_idx" ON "users"("walletAddress");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "tasks_requesterId_idx" ON "tasks"("requesterId");

-- CreateIndex
CREATE INDEX "tasks_executorId_idx" ON "tasks"("executorId");

-- CreateIndex
CREATE INDEX "tasks_category_idx" ON "tasks"("category");

-- CreateIndex
CREATE INDEX "tasks_riskLevel_idx" ON "tasks"("riskLevel");

-- CreateIndex
CREATE INDEX "tasks_createdAt_idx" ON "tasks"("createdAt");

-- CreateIndex
CREATE INDEX "task_proofs_taskId_idx" ON "task_proofs"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "task_payments_taskId_key" ON "task_payments"("taskId");

-- CreateIndex
CREATE INDEX "task_payments_escrowStatus_idx" ON "task_payments"("escrowStatus");

-- CreateIndex
CREATE INDEX "task_reviews_reviewedId_idx" ON "task_reviews"("reviewedId");

-- CreateIndex
CREATE UNIQUE INDEX "task_reviews_taskId_reviewerId_key" ON "task_reviews"("taskId", "reviewerId");

-- CreateIndex
CREATE INDEX "task_disputes_taskId_idx" ON "task_disputes"("taskId");

-- CreateIndex
CREATE INDEX "task_disputes_status_idx" ON "task_disputes"("status");

-- CreateIndex
CREATE INDEX "moderation_flags_taskId_idx" ON "moderation_flags"("taskId");

-- CreateIndex
CREATE INDEX "moderation_flags_isResolved_idx" ON "moderation_flags"("isResolved");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "wallet_connections_walletAddress_idx" ON "wallet_connections"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_connections_userId_walletAddress_key" ON "wallet_connections"("userId", "walletAddress");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_executorId_fkey" FOREIGN KEY ("executorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_proofs" ADD CONSTRAINT "task_proofs_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_payments" ADD CONSTRAINT "task_payments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_reviews" ADD CONSTRAINT "task_reviews_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_disputes" ADD CONSTRAINT "task_disputes_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_disputes" ADD CONSTRAINT "task_disputes_filerId_fkey" FOREIGN KEY ("filerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_flaggedUserId_fkey" FOREIGN KEY ("flaggedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
