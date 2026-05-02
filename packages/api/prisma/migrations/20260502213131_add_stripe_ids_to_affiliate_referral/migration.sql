-- AlterTable
ALTER TABLE "AffiliateReferral" ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT;

-- CreateIndex
CREATE INDEX "AffiliateReferral_stripePaymentIntentId_idx" ON "AffiliateReferral"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "AffiliateReferral_stripeChargeId_idx" ON "AffiliateReferral"("stripeChargeId");
