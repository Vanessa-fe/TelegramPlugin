-- CreateEnum
CREATE TYPE "GiftCodeStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "GiftCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "GiftCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "planIds" TEXT[],
    "organizationIds" TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GiftCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftCodeUsage" (
    "id" TEXT NOT NULL,
    "giftCodeId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerEmail" TEXT,
    "planId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftCodeUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GiftCode_code_key" ON "GiftCode"("code");

-- CreateIndex
CREATE INDEX "GiftCode_code_idx" ON "GiftCode"("code");

-- CreateIndex
CREATE INDEX "GiftCode_status_idx" ON "GiftCode"("status");

-- CreateIndex
CREATE UNIQUE INDEX "GiftCodeUsage_subscriptionId_key" ON "GiftCodeUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "GiftCodeUsage_giftCodeId_idx" ON "GiftCodeUsage"("giftCodeId");

-- CreateIndex
CREATE INDEX "GiftCodeUsage_customerId_idx" ON "GiftCodeUsage"("customerId");

-- AddForeignKey
ALTER TABLE "GiftCodeUsage" ADD CONSTRAINT "GiftCodeUsage_giftCodeId_fkey" FOREIGN KEY ("giftCodeId") REFERENCES "GiftCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
