-- CreateEnum
CREATE TYPE "VipInvitationStatus" AS ENUM ('PENDING', 'ACTIVATED', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "VipInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "VipInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "platformPlanName" TEXT NOT NULL,
    "trialDays" INTEGER NOT NULL,
    "emailSentAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "organizationId" TEXT,
    "offersCreated" INTEGER NOT NULL DEFAULT 0,
    "salesGenerated" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VipInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VipInvitation_token_key" ON "VipInvitation"("token");

-- CreateIndex
CREATE INDEX "VipInvitation_email_idx" ON "VipInvitation"("email");

-- CreateIndex
CREATE INDEX "VipInvitation_status_idx" ON "VipInvitation"("status");

-- CreateIndex
CREATE INDEX "VipInvitation_token_idx" ON "VipInvitation"("token");
