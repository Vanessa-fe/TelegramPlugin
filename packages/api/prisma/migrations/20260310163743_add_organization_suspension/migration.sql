-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "suspendReason" TEXT,
ADD COLUMN     "suspendedAt" TIMESTAMP(3);
