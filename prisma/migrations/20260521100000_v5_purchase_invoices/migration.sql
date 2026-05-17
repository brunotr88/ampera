-- v5: purchase invoices with line-level warehouse/asset assignment

CREATE TYPE "PurchaseLineType" AS ENUM ('WAREHOUSE', 'ASSET', 'EXPENSE', 'CONSUMABLE');

CREATE TABLE "PurchaseInvoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id"),
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id"),
  "number" TEXT NOT NULL,
  "series" TEXT,
  "issueDate" TIMESTAMP(3) NOT NULL,
  "receiveDate" TIMESTAMP(3),
  "dueDate" TIMESTAMP(3),
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
  "paymentDate" TIMESTAMP(3),
  "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vatTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "withholdingTax" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reverseCharge" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "internalNotes" TEXT,
  "attachmentUrl" TEXT,
  "purchaseOrderId" TEXT,
  "registeredById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "PurchaseInvoice_tenantId_supplierId_number_series_key" ON "PurchaseInvoice"("tenantId", "supplierId", "number", "series");
CREATE INDEX "PurchaseInvoice_tenantId_idx" ON "PurchaseInvoice"("tenantId");
CREATE INDEX "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");
CREATE INDEX "PurchaseInvoice_issueDate_idx" ON "PurchaseInvoice"("issueDate");
CREATE INDEX "PurchaseInvoice_paymentStatus_idx" ON "PurchaseInvoice"("paymentStatus");

CREATE TABLE "PurchaseInvoiceLine" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL REFERENCES "PurchaseInvoice"("id") ON DELETE CASCADE,
  "position" INTEGER NOT NULL,
  "type" "PurchaseLineType" NOT NULL DEFAULT 'WAREHOUSE',
  "materialId" TEXT,
  "materialCode" TEXT,
  "description" TEXT NOT NULL,
  "lineNote" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL DEFAULT 'pz',
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "discountPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 22,
  "total" DOUBLE PRECISION NOT NULL,
  "warehouseId" TEXT,
  "assetId" TEXT,
  "amortizationYears" INTEGER NOT NULL DEFAULT 5,
  "stockMovementId" TEXT
);
CREATE INDEX "PurchaseInvoiceLine_invoiceId_idx" ON "PurchaseInvoiceLine"("invoiceId");
