-- v10: Sistema documentazione completo (verbali, attestati, dichiarazioni)
-- AmperaDocument distinto da Document (legacy per allegati file)

CREATE TABLE IF NOT EXISTS "DocumentTemplate" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "bodyTemplate" TEXT NOT NULL,
  "requireSignature" BOOLEAN NOT NULL DEFAULT true,
  "signerRole" TEXT NOT NULL DEFAULT 'CUSTOMER',
  "legalReference" TEXT,
  "audience" TEXT NOT NULL DEFAULT 'CUSTOMER',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentTemplate_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentTemplate_tenant_code_key" ON "DocumentTemplate"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_tenantId_idx" ON "DocumentTemplate"("tenantId");
CREATE INDEX IF NOT EXISTS "DocumentTemplate_category_idx" ON "DocumentTemplate"("category");

CREATE TABLE IF NOT EXISTS "AmperaDocument" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "templateId" TEXT,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "customerId" TEXT,
  "plantId" TEXT,
  "workOrderId" TEXT,
  "reportId" TEXT,
  "projectId" TEXT,
  "contentHtml" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "generatedAt" TIMESTAMP(3),
  "pdfUrl" TEXT,
  "sentAt" TIMESTAMP(3),
  "sentTo" TEXT,
  "sentById" TEXT,
  "signedAt" TIMESTAMP(3),
  "signedByName" TEXT,
  "signedByEmail" TEXT,
  "signerRole" TEXT,
  "signatureType" TEXT,
  "signatureDataUrl" TEXT,
  "signatureMeta" TEXT,
  "signatureFileUrl" TEXT,
  "otpHash" TEXT,
  "otpSentAt" TIMESTAMP(3),
  "otpAttempts" INTEGER NOT NULL DEFAULT 0,
  "otpExpiresAt" TIMESTAMP(3),
  "shareToken" TEXT,
  "shareExpiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedReason" TEXT,
  "customFieldsJson" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "AmperaDocument_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id"),
  CONSTRAINT "AmperaDocument_template_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AmperaDocument_tenant_code_key" ON "AmperaDocument"("tenantId", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "AmperaDocument_shareToken_key" ON "AmperaDocument"("shareToken");
CREATE INDEX IF NOT EXISTS "AmperaDocument_tenantId_idx" ON "AmperaDocument"("tenantId");
CREATE INDEX IF NOT EXISTS "AmperaDocument_customerId_idx" ON "AmperaDocument"("customerId");
CREATE INDEX IF NOT EXISTS "AmperaDocument_plantId_idx" ON "AmperaDocument"("plantId");
CREATE INDEX IF NOT EXISTS "AmperaDocument_workOrderId_idx" ON "AmperaDocument"("workOrderId");
CREATE INDEX IF NOT EXISTS "AmperaDocument_status_idx" ON "AmperaDocument"("status");
CREATE INDEX IF NOT EXISTS "AmperaDocument_category_idx" ON "AmperaDocument"("category");

-- FTS GIN italiano
CREATE INDEX IF NOT EXISTS "amperadocument_fts_idx" ON "AmperaDocument" USING GIN (
  to_tsvector('italian',
    coalesce(code::text,'') || ' ' ||
    coalesce(title::text,'') || ' ' ||
    coalesce(category::text,'') || ' ' ||
    coalesce("signedByName"::text,'') || ' ' ||
    coalesce("sentTo"::text,'')
  )
);
