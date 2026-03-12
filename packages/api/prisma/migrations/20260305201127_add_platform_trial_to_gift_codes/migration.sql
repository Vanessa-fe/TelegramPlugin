-- AlterTable
ALTER TABLE "GiftCode" ADD COLUMN     "isPlatformTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platformPlanName" TEXT,
ADD COLUMN     "trialDays" INTEGER;
