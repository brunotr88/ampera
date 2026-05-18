-- v8: estende Contact per essere legato a Customer O Plant (referenti in loco)
-- e aggiunge contactId opzionale a Report e WorkOrder

ALTER TABLE "Contact" ALTER COLUMN "customerId" DROP NOT NULL;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "plantId" TEXT;

ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_plantId_fkey"
  FOREIGN KEY ("plantId") REFERENCES "Plant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "Contact_plantId_idx" ON "Contact"("plantId");

-- check almeno uno tra customerId e plantId presente
ALTER TABLE "Contact"
  ADD CONSTRAINT "Contact_customer_or_plant_check"
  CHECK ("customerId" IS NOT NULL OR "plantId" IS NOT NULL);

-- contactId opzionale su Report e WorkOrder per dropdown referente in loco
ALTER TABLE "Report" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "WorkOrder" ADD COLUMN IF NOT EXISTS "contactId" TEXT;

-- Asset: link a PurchaseInvoice (opzionale, per ricerca/selezione fattura associata)
ALTER TABLE "AssetAcquisition" ADD COLUMN IF NOT EXISTS "purchaseInvoiceId" TEXT;
CREATE INDEX IF NOT EXISTS "AssetAcquisition_purchaseInvoiceId_idx" ON "AssetAcquisition"("purchaseInvoiceId");
