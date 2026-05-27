-- v11: Workflow stati custom per tenant + tracking pubblico WorkOrder

CREATE TABLE IF NOT EXISTS "WorkflowState" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#3B82F6',
  "icon" TEXT,
  "percentage" INTEGER NOT NULL DEFAULT 0,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isFinal" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "triggersClientEmail" BOOLEAN NOT NULL DEFAULT false,
  "triggersInternalNote" BOOLEAN NOT NULL DEFAULT false,
  "emailSubject" TEXT,
  "emailBodyHtml" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowState_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowState_tenant_scope_name_key" ON "WorkflowState"("tenantId", "scope", "name");
CREATE INDEX IF NOT EXISTS "WorkflowState_tenant_scope_idx" ON "WorkflowState"("tenantId", "scope");

ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "trackingHash" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "customStateId" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "customerEmailNotifiedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "WorkOrder_trackingHash_key" ON "WorkOrder"("trackingHash");
CREATE INDEX IF NOT EXISTS "WorkOrder_customStateId_idx" ON "WorkOrder"("customStateId");
