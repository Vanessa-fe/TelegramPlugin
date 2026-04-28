-- CreateEnum
CREATE TYPE "ConversionStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'PAID');

-- CreateEnum
CREATE TYPE "AffiliateProgramStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommissionAppliesTo" AS ENUM ('ALL_PRODUCTS', 'SPECIFIC_PRODUCTS');

-- AlterTable
ALTER TABLE "Affiliate" ADD COLUMN     "totalClicks" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "AffiliateReferral" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "clickId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "status" "ConversionStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "AffiliateProgram" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "commissionValue" INTEGER NOT NULL,
    "attributionWindowDays" INTEGER NOT NULL DEFAULT 30,
    "validationDelayDays" INTEGER NOT NULL DEFAULT 14,
    "appliesTo" "CommissionAppliesTo" NOT NULL DEFAULT 'ALL_PRODUCTS',
    "productIds" TEXT[],
    "status" "AffiliateProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateClick" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "landingPage" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffiliateClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateProgram_organizationId_key" ON "AffiliateProgram"("organizationId");

-- CreateIndex
CREATE INDEX "AffiliateClick_affiliateId_createdAt_idx" ON "AffiliateClick"("affiliateId", "createdAt");

-- CreateIndex
CREATE INDEX "AffiliateClick_visitorId_idx" ON "AffiliateClick"("visitorId");

-- CreateIndex
CREATE INDEX "AffiliateReferral_affiliateId_status_idx" ON "AffiliateReferral"("affiliateId", "status");

-- CreateIndex
CREATE INDEX "AffiliateReferral_status_createdAt_idx" ON "AffiliateReferral"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "AffiliateProgram" ADD CONSTRAINT "AffiliateProgram_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateClick" ADD CONSTRAINT "AffiliateClick_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateReferral" ADD CONSTRAINT "AffiliateReferral_clickId_fkey" FOREIGN KEY ("clickId") REFERENCES "AffiliateClick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Migrate existing referrals to new status workflow
-- isPaid=true -> status=PAID
UPDATE "AffiliateReferral"
SET status = 'PAID', "paidAt" = NOW()
WHERE "isPaid" = true;

-- isPaid=false -> status=APPROVED (consider them already validated)
UPDATE "AffiliateReferral"
SET status = 'APPROVED', "approvedAt" = NOW()
WHERE "isPaid" = false;
