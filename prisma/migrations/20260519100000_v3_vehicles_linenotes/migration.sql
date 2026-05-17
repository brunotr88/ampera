-- v3: vehicle fleet + line notes on quote/invoice/PO

CREATE TYPE "VehicleType" AS ENUM ('VAN', 'TRUCK', 'CAR', 'ELECTRIC', 'MOTORCYCLE', 'TRAILER', 'OTHER');
CREATE TYPE "VehicleLogType" AS ENUM ('REFUEL', 'MAINTENANCE', 'INSPECTION', 'INSURANCE_RENEWAL', 'TIRE_CHANGE', 'REPAIR', 'CAR_WASH', 'TOLL', 'PARKING', 'KM_LOG', 'ACCIDENT', 'OTHER');

CREATE TABLE "Vehicle" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id"),
  "assignedToId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "plate" TEXT NOT NULL,
  "brand" TEXT,
  "model" TEXT,
  "type" "VehicleType" NOT NULL DEFAULT 'VAN',
  "year" INTEGER,
  "fuelType" TEXT,
  "currentKm" INTEGER NOT NULL DEFAULT 0,
  "registrationDate" TIMESTAMP(3),
  "purchaseDate" TIMESTAMP(3),
  "purchasePrice" DOUBLE PRECISION,
  "insuranceCompany" TEXT,
  "insurancePolicyNo" TEXT,
  "insuranceExpiry" TIMESTAMP(3),
  "inspectionExpiry" TIMESTAMP(3),
  "maintenanceExpiry" TIMESTAMP(3),
  "maintenanceKmDue" INTEGER,
  "bolloExpiry" TIMESTAMP(3),
  "tachographExpiry" TIMESTAMP(3),
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "Vehicle_tenantId_plate_key" ON "Vehicle"("tenantId", "plate");
CREATE INDEX "Vehicle_tenantId_idx" ON "Vehicle"("tenantId");
CREATE INDEX "Vehicle_assignedToId_idx" ON "Vehicle"("assignedToId");
CREATE INDEX "Vehicle_insuranceExpiry_idx" ON "Vehicle"("insuranceExpiry");
CREATE INDEX "Vehicle_inspectionExpiry_idx" ON "Vehicle"("inspectionExpiry");
CREATE INDEX "Vehicle_maintenanceExpiry_idx" ON "Vehicle"("maintenanceExpiry");

CREATE TABLE "VehicleLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vehicleId" TEXT NOT NULL REFERENCES "Vehicle"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "type" "VehicleLogType" NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "km" INTEGER,
  "cost" DOUBLE PRECISION,
  "description" TEXT NOT NULL,
  "invoiceRef" TEXT,
  "attachmentUrl" TEXT,
  "nextDueDate" TIMESTAMP(3),
  "nextDueKm" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "VehicleLog_vehicleId_idx" ON "VehicleLog"("vehicleId");
CREATE INDEX "VehicleLog_type_idx" ON "VehicleLog"("type");
CREATE INDEX "VehicleLog_date_idx" ON "VehicleLog"("date");

-- Line notes on documents
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "lineNote" TEXT;
ALTER TABLE "InvoiceLine" ADD COLUMN IF NOT EXISTS "lineNote" TEXT;
ALTER TABLE "PurchaseOrderLine" ADD COLUMN IF NOT EXISTS "lineNote" TEXT;

-- Asset acquisitions
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'DISPOSED', 'SOLD', 'WRITTEN_OFF', 'IN_REPAIR');

CREATE TABLE "AssetAcquisition" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id"),
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "serialNumber" TEXT,
  "acquisitionDate" TIMESTAMP(3) NOT NULL,
  "purchasePrice" DOUBLE PRECISION NOT NULL,
  "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 22,
  "amortizationYears" INTEGER NOT NULL DEFAULT 5,
  "amortizationStartDate" TIMESTAMP(3),
  "residualValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
  "location" TEXT,
  "supplierId" TEXT,
  "invoiceRef" TEXT,
  "notes" TEXT,
  "disposalDate" TIMESTAMP(3),
  "disposalValue" DOUBLE PRECISION,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "AssetAcquisition_tenantId_code_key" ON "AssetAcquisition"("tenantId", "code");
CREATE INDEX "AssetAcquisition_tenantId_idx" ON "AssetAcquisition"("tenantId");
CREATE INDEX "AssetAcquisition_category_idx" ON "AssetAcquisition"("category");
CREATE INDEX "AssetAcquisition_status_idx" ON "AssetAcquisition"("status");
