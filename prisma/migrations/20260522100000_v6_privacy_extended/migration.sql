-- v6: privacy extended (supplierId + reminder + revoke reason + custom fields)

ALTER TABLE "PrivacyDocument"
  ADD COLUMN IF NOT EXISTS "supplierId" TEXT,
  ADD COLUMN IF NOT EXISTS "revokedReason" TEXT,
  ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "customFieldsJson" JSONB;

CREATE INDEX IF NOT EXISTS "PrivacyDocument_supplierId_idx" ON "PrivacyDocument"("supplierId");
