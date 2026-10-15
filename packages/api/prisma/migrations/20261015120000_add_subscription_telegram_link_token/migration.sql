-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "telegramLinkToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_telegramLinkToken_key" ON "Subscription"("telegramLinkToken");
