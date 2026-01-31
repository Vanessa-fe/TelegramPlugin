-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "slug" TEXT;

-- CreateIndex (unique per organization)
CREATE UNIQUE INDEX "Subscription_organizationId_slug_key" ON "Subscription"("organizationId", "slug");
