-- v7: GIN FTS indexes (italian) per ricerca full-text per-tabella
-- Espressione tsvector identica a buildTsVectorExpr() in src/lib/search-fields.ts
-- ::text cast per supportare colonne enum (PlantType, etc).

DROP INDEX IF EXISTS "customer_fts_idx";
CREATE INDEX "customer_fts_idx" ON "Customer" USING GIN (to_tsvector('italian', coalesce(name::text,'') || ' ' || coalesce(surname::text,'') || ' ' || coalesce("companyName"::text,'') || ' ' || coalesce("vatNumber"::text,'') || ' ' || coalesce("fiscalCode"::text,'') || ' ' || coalesce(email::text,'') || ' ' || coalesce(phone::text,'') || ' ' || coalesce(mobile::text,'') || ' ' || coalesce("sdiCode"::text,'') || ' ' || coalesce(pec::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "supplier_fts_idx";
CREATE INDEX "supplier_fts_idx" ON "Supplier" USING GIN (to_tsvector('italian', coalesce(name::text,'') || ' ' || coalesce("vatNumber"::text,'') || ' ' || coalesce("fiscalCode"::text,'') || ' ' || coalesce(email::text,'') || ' ' || coalesce(phone::text,'') || ' ' || coalesce(address::text,'') || ' ' || coalesce(city::text,'') || ' ' || coalesce(province::text,'') || ' ' || coalesce(zip::text,'')));
DROP INDEX IF EXISTS "plant_fts_idx";
CREATE INDEX "plant_fts_idx" ON "Plant" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce(name::text,'') || ' ' || coalesce(type::text,'') || ' ' || coalesce("certificationStatus"::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "project_fts_idx";
CREATE INDEX "project_fts_idx" ON "Project" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce(name::text,'') || ' ' || coalesce(description::text,'') || ' ' || coalesce("rupName"::text,'') || ' ' || coalesce("dlName"::text,'') || ' ' || coalesce("cigCode"::text,'') || ' ' || coalesce("cupCode"::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "workorder_fts_idx";
CREATE INDEX "workorder_fts_idx" ON "WorkOrder" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce(title::text,'') || ' ' || coalesce(description::text,'') || ' ' || coalesce(type::text,'') || ' ' || coalesce(cause::text,'')));
DROP INDEX IF EXISTS "report_fts_idx";
CREATE INDEX "report_fts_idx" ON "Report" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce("workType"::text,'') || ' ' || coalesce(cause::text,'') || ' ' || coalesce(description::text,'')));
DROP INDEX IF EXISTS "quote_fts_idx";
CREATE INDEX "quote_fts_idx" ON "Quote" USING GIN (to_tsvector('italian', coalesce(number::text,'') || ' ' || coalesce(title::text,'') || ' ' || coalesce(description::text,'') || ' ' || coalesce(terms::text,'') || ' ' || coalesce("internalNotes"::text,'')));
DROP INDEX IF EXISTS "invoice_fts_idx";
CREATE INDEX "invoice_fts_idx" ON "Invoice" USING GIN (to_tsvector('italian', coalesce(number::text,'') || ' ' || coalesce(series::text,'') || ' ' || coalesce("paymentMethod"::text,'') || ' ' || coalesce(notes::text,'') || ' ' || coalesce("internalNotes"::text,'') || ' ' || coalesce("sdiIdentifier"::text,'')));
DROP INDEX IF EXISTS "purchaseorder_fts_idx";
CREATE INDEX "purchaseorder_fts_idx" ON "PurchaseOrder" USING GIN (to_tsvector('italian', coalesce(number::text,'') || ' ' || coalesce(notes::text,'') || ' ' || coalesce("internalNotes"::text,'')));
DROP INDEX IF EXISTS "purchaseinvoice_fts_idx";
CREATE INDEX "purchaseinvoice_fts_idx" ON "PurchaseInvoice" USING GIN (to_tsvector('italian', coalesce(number::text,'') || ' ' || coalesce(series::text,'') || ' ' || coalesce(notes::text,'') || ' ' || coalesce("internalNotes"::text,'')));
DROP INDEX IF EXISTS "material_fts_idx";
CREATE INDEX "material_fts_idx" ON "Material" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce("metelCode"::text,'') || ' ' || coalesce(barcode::text,'') || ' ' || coalesce(name::text,'') || ' ' || coalesce(brand::text,'') || ' ' || coalesce(category::text,'') || ' ' || coalesce(description::text,'')));
DROP INDEX IF EXISTS "vehicle_fts_idx";
CREATE INDEX "vehicle_fts_idx" ON "Vehicle" USING GIN (to_tsvector('italian', coalesce(plate::text,'') || ' ' || coalesce(brand::text,'') || ' ' || coalesce(model::text,'') || ' ' || coalesce("fuelType"::text,'') || ' ' || coalesce("insuranceCompany"::text,'') || ' ' || coalesce("insurancePolicyNo"::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "maintenancecontract_fts_idx";
CREATE INDEX "maintenancecontract_fts_idx" ON "MaintenanceContract" USING GIN (to_tsvector('italian', coalesce(name::text,'') || ' ' || coalesce(description::text,'')));
DROP INDEX IF EXISTS "cashbookentry_fts_idx";
CREATE INDEX "cashbookentry_fts_idx" ON "CashbookEntry" USING GIN (to_tsvector('italian', coalesce(category::text,'') || ' ' || coalesce(description::text,'') || ' ' || coalesce(counterpart::text,'') || ' ' || coalesce("documentRef"::text,'') || ' ' || coalesce("paymentMethod"::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "incentiveapplication_fts_idx";
CREATE INDEX "incentiveapplication_fts_idx" ON "IncentiveApplication" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce("workDescription"::text,'') || ' ' || coalesce("bankTransferRef"::text,'') || ' ' || coalesce("bankTransferDescription"::text,'') || ' ' || coalesce("agenciaProtocol"::text,'')));
DROP INDEX IF EXISTS "privacydocument_fts_idx";
CREATE INDEX "privacydocument_fts_idx" ON "PrivacyDocument" USING GIN (to_tsvector('italian', coalesce(audience::text,'') || ' ' || coalesce("subjectName"::text,'') || ' ' || coalesce("subjectEmail"::text,'') || ' ' || coalesce("subjectFiscalCode"::text,'') || ' ' || coalesce("signerName"::text,'')));
DROP INDEX IF EXISTS "conformitydeclaration_fts_idx";
CREATE INDEX "conformitydeclaration_fts_idx" ON "ConformityDeclaration" USING GIN (to_tsvector('italian', coalesce(number::text,'') || ' ' || coalesce("rtName"::text,'') || ' ' || coalesce("rtRegistrationNo"::text,'') || ' ' || coalesce(notes::text,'')));
DROP INDEX IF EXISTS "assetacquisition_fts_idx";
CREATE INDEX "assetacquisition_fts_idx" ON "AssetAcquisition" USING GIN (to_tsvector('italian', coalesce(code::text,'') || ' ' || coalesce(name::text,'') || ' ' || coalesce(description::text,'') || ' ' || coalesce(category::text,'') || ' ' || coalesce("serialNumber"::text,'') || ' ' || coalesce(location::text,'') || ' ' || coalesce("invoiceRef"::text,'') || ' ' || coalesce(notes::text,'')));
