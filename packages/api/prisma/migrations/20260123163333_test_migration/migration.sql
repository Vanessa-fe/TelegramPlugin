-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "graceUntil" TIMESTAMP(3),
ADD COLUMN     "lastPaymentFailedAt" TIMESTAMP(3);
