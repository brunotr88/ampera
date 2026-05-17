-- v2 features migration: adds attachments, faq, incentives, privacy docs, user preferences, line discount/VAT extensions

-- New enums
CREATE TYPE "AttachmentCategory" AS ENUM ('GENERAL', 'PHOTO', 'PDF', 'DICO', 'CERTIFICATE', 'CONTRACT', 'PRIVACY_CONSENT', 'ID_DOCUMENT', 'INVOICE_ATTACHMENT', 'PROJECT_PLAN', 'TECHNICAL_DRAWING', 'SAFETY_DOC', 'REPORT_PDF', 'OTHER');
CREATE TYPE "FaqAudience" AS ENUM ('ADMIN', 'OPERATOR', 'CUSTOMER', 'PUBLIC');
CREATE TYPE "IncentiveType" AS ENUM ('RESTRUCTURING_50', 'ECOBONUS_65', 'ECOBONUS_50', 'FURNITURE_BONUS_50', 'SEISMABONUS_50', 'SEISMABONUS_70', 'SEISMABONUS_80', 'SEISMABONUS_85', 'GREEN_BONUS_36', 'BARRIER_REMOVAL_75', 'CHARGING_STATION_80', 'SUPERBONUS_110', 'SUPERBONUS_90', 'SUPERBONUS_70', 'SUPERBONUS_65', 'CONTO_TERMICO', 'CONTO_TERMICO_PA', 'ELECTRIC_RENOVATION_50', 'DOMOTIC_BONUS_65', 'PV_SELF_CONSUMPTION', 'OTHER');
CREATE TYPE "IncentiveStatus" AS ENUM ('DRAFT', 'ELIGIBLE', 'DOCUMENTS_READY', 'BANK_TRANSFER_DONE', 'ENEA_SUBMITTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PrivacyDocType" AS ENUM ('CUSTOMER_INFORMATIVE', 'CUSTOMER_CONSENT', 'EMPLOYEE_INFORMATIVE', 'EMPLOYEE_CONSENT', 'CONTRACTOR_NDA', 'MARKETING_CONSENT', 'COOKIE_BANNER', 'DATA_PROCESSING_AGREEMENT', 'CCTV_INFORMATIVE', 'GEO_TRACKING_CONSENT', 'CUSTOM');

-- Extend QuoteLine
ALTER TABLE "QuoteLine"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "vatExemptionCode" TEXT,
  ADD COLUMN IF NOT EXISTS "vatNote" TEXT;

-- Extend InvoiceLine
ALTER TABLE "InvoiceLine"
  ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "vatExemptionCode" TEXT,
  ADD COLUMN IF NOT EXISTS "vatNote" TEXT,
  ADD COLUMN IF NOT EXISTS "incentiveCode" TEXT;

-- UserPreference
CREATE TABLE "UserPreference" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'system',
  "language" TEXT NOT NULL DEFAULT 'it',
  "density" TEXT NOT NULL DEFAULT 'comfortable',
  "emailDigest" BOOLEAN NOT NULL DEFAULT true,
  "hideTips" BOOLEAN NOT NULL DEFAULT false,
  "defaultLandingPath" TEXT,
  "shortcutsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");
CREATE INDEX "UserPreference_tenantId_idx" ON "UserPreference"("tenantId");
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Attachment (polymorphic)
CREATE TABLE "Attachment" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "category" "AttachmentCategory" NOT NULL DEFAULT 'GENERAL',
  "mimeType" TEXT,
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  "width" INTEGER,
  "height" INTEGER,
  "uploadedById" TEXT,
  "notes" TEXT,
  "takenAt" TIMESTAMP(3),
  "lat" DOUBLE PRECISION,
  "lon" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Attachment_tenantId_idx" ON "Attachment"("tenantId");
CREATE INDEX "Attachment_entityType_entityId_idx" ON "Attachment"("entityType", "entityId");
CREATE INDEX "Attachment_category_idx" ON "Attachment"("category");
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Faq
CREATE TABLE "Faq" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "category" TEXT,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "audience" "FaqAudience" NOT NULL DEFAULT 'ADMIN',
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "views" INTEGER NOT NULL DEFAULT 0,
  "helpful" INTEGER NOT NULL DEFAULT 0,
  "notHelpful" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Faq_tenantId_audience_idx" ON "Faq"("tenantId", "audience");
CREATE INDEX "Faq_category_idx" ON "Faq"("category");
CREATE INDEX "Faq_isGlobal_idx" ON "Faq"("isGlobal");
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- IncentiveApplication
CREATE TABLE "IncentiveApplication" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT,
  "plantId" TEXT,
  "projectId" TEXT,
  "invoiceId" TEXT,
  "code" TEXT NOT NULL,
  "type" "IncentiveType" NOT NULL,
  "workDescription" TEXT NOT NULL,
  "workStartDate" TIMESTAMP(3),
  "workEndDate" TIMESTAMP(3),
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deductiblePercentage" DOUBLE PRECISION NOT NULL,
  "deductibleAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "yearsOfRecovery" INTEGER NOT NULL DEFAULT 10,
  "yearlyAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "IncentiveStatus" NOT NULL DEFAULT 'DRAFT',
  "bankTransferRef" TEXT,
  "bankTransferDate" TIMESTAMP(3),
  "bankTransferDescription" TEXT,
  "enéaProtocol" TEXT,
  "enéaSubmittedAt" TIMESTAMP(3),
  "agenciaProtocol" TEXT,
  "cessionAccredito" BOOLEAN NOT NULL DEFAULT false,
  "sconfoFattura" BOOLEAN NOT NULL DEFAULT false,
  "technicalAsseveration" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IncentiveApplication_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "IncentiveApplication_tenantId_code_key" ON "IncentiveApplication"("tenantId", "code");
CREATE INDEX "IncentiveApplication_tenantId_idx" ON "IncentiveApplication"("tenantId");
CREATE INDEX "IncentiveApplication_customerId_idx" ON "IncentiveApplication"("customerId");
CREATE INDEX "IncentiveApplication_type_idx" ON "IncentiveApplication"("type");
CREATE INDEX "IncentiveApplication_status_idx" ON "IncentiveApplication"("status");
ALTER TABLE "IncentiveApplication" ADD CONSTRAINT "IncentiveApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- PrivacyDocument
CREATE TABLE "PrivacyDocument" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" "PrivacyDocType" NOT NULL,
  "audience" TEXT NOT NULL,
  "subjectName" TEXT,
  "subjectEmail" TEXT,
  "subjectFiscalCode" TEXT,
  "customerId" TEXT,
  "userId" TEXT,
  "version" TEXT NOT NULL DEFAULT '1.0',
  "contentHtml" TEXT,
  "signedAt" TIMESTAMP(3),
  "signatureDataUrl" TEXT,
  "signerName" TEXT,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "consentsJson" JSONB,
  "pdfUrl" TEXT,
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrivacyDocument_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PrivacyDocument_tenantId_idx" ON "PrivacyDocument"("tenantId");
CREATE INDEX "PrivacyDocument_customerId_idx" ON "PrivacyDocument"("customerId");
CREATE INDEX "PrivacyDocument_userId_idx" ON "PrivacyDocument"("userId");
CREATE INDEX "PrivacyDocument_type_idx" ON "PrivacyDocument"("type");
ALTER TABLE "PrivacyDocument" ADD CONSTRAINT "PrivacyDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Performance indices for search & sort
CREATE INDEX IF NOT EXISTS "Customer_name_idx" ON "Customer"("name");
CREATE INDEX IF NOT EXISTS "Customer_companyName_idx" ON "Customer"("companyName");
CREATE INDEX IF NOT EXISTS "Customer_createdAt_idx" ON "Customer"("createdAt");
CREATE INDEX IF NOT EXISTS "Invoice_issueDate_idx" ON "Invoice"("issueDate");
CREATE INDEX IF NOT EXISTS "Invoice_dueDate_idx" ON "Invoice"("dueDate");
CREATE INDEX IF NOT EXISTS "Report_createdAt_idx" ON "Report"("createdAt");
CREATE INDEX IF NOT EXISTS "Quote_number_idx" ON "Quote"("number");
CREATE INDEX IF NOT EXISTS "Plant_name_idx" ON "Plant"("name");
CREATE INDEX IF NOT EXISTS "WorkOrder_scheduledDate_assignedToId_idx" ON "WorkOrder"("scheduledDate", "assignedToId");
