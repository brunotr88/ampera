-- v4: report workflow improvements

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "reportNotificationEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "reportNotificationCcAdmins" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "reportReminderEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "reportReminderHour" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Report"
  ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "cancelReason" TEXT,
  ADD COLUMN IF NOT EXISTS "notifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "pdfStoredAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rowsJson" JSONB;

CREATE TABLE IF NOT EXISTS "ReportReminderSent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reminderDate" TIMESTAMP(3) NOT NULL,
  "type" TEXT NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "recipient" TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReportReminderSent_tenantId_userId_reminderDate_type_key" ON "ReportReminderSent"("tenantId", "userId", "reminderDate", "type");
CREATE INDEX IF NOT EXISTS "ReportReminderSent_reminderDate_idx" ON "ReportReminderSent"("reminderDate");
