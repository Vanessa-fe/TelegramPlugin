-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "pageSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Organization_pageSlug_key" ON "Organization"("pageSlug");
