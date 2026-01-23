ALTER TABLE "AuditLog" ADD COLUMN "correlationId" TEXT;

CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");
