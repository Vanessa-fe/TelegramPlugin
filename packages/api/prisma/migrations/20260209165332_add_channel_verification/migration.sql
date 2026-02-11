-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('CHANNEL', 'GROUP');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'USED');

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "type" "ChannelType" NOT NULL DEFAULT 'CHANNEL';

-- CreateTable
CREATE TABLE "ChannelVerification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ChannelType" NOT NULL DEFAULT 'CHANNEL',
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "telegramChatId" TEXT,
    "telegramTitle" TEXT,
    "telegramUsername" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelVerification_code_key" ON "ChannelVerification"("code");

-- CreateIndex
CREATE INDEX "ChannelVerification_code_idx" ON "ChannelVerification"("code");

-- CreateIndex
CREATE INDEX "ChannelVerification_organizationId_idx" ON "ChannelVerification"("organizationId");

-- CreateIndex
CREATE INDEX "ChannelVerification_status_expiresAt_idx" ON "ChannelVerification"("status", "expiresAt");

-- AddForeignKey
ALTER TABLE "ChannelVerification" ADD CONSTRAINT "ChannelVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
