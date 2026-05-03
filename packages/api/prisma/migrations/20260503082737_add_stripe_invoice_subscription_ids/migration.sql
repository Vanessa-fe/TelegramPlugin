-- AlterTable
ALTER TABLE "AffiliateReferral" ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeInvoiceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "AffiliateReferral_stripeCheckoutSessionId_idx" ON "AffiliateReferral"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "AffiliateReferral_stripeInvoiceId_idx" ON "AffiliateReferral"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "AffiliateReferral_stripeSubscriptionId_idx" ON "AffiliateReferral"("stripeSubscriptionId");
