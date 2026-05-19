-- v9: Prezzario DEI + listini personalizzati con multi-anno

CREATE TABLE IF NOT EXISTS "PriceList" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'DEI',
  "year" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "description" TEXT,
  "importedAt" TIMESTAMP(3),
  "importSourceFile" TEXT,
  "totalEntries" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceList_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PriceList_tenant_name_year_key" ON "PriceList"("tenantId", "name", "year");
CREATE INDEX IF NOT EXISTS "PriceList_tenantId_idx" ON "PriceList"("tenantId");
CREATE INDEX IF NOT EXISTS "PriceList_source_idx" ON "PriceList"("source");

CREATE TABLE IF NOT EXISTS "PriceListEntry" (
  "id" TEXT PRIMARY KEY,
  "priceListId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "chapter" TEXT,
  "category" TEXT,
  "subCategory" TEXT,
  "description" TEXT NOT NULL,
  "shortDescription" TEXT,
  "unit" TEXT NOT NULL DEFAULT 'pz',
  "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "materialCost" DOUBLE PRECISION,
  "laborCost" DOUBLE PRECISION,
  "laborHours" DOUBLE PRECISION,
  "laborRate" DOUBLE PRECISION,
  "equipmentCost" DOUBLE PRECISION,
  "notes" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceListEntry_priceList_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE CASCADE,
  CONSTRAINT "PriceListEntry_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PriceListEntry_priceList_code_key" ON "PriceListEntry"("priceListId", "code");
CREATE INDEX IF NOT EXISTS "PriceListEntry_priceListId_idx" ON "PriceListEntry"("priceListId");
CREATE INDEX IF NOT EXISTS "PriceListEntry_code_idx" ON "PriceListEntry"("code");
CREATE INDEX IF NOT EXISTS "PriceListEntry_chapter_idx" ON "PriceListEntry"("chapter");
CREATE INDEX IF NOT EXISTS "PriceListEntry_tenantId_idx" ON "PriceListEntry"("tenantId");

-- GIN FTS italiano
CREATE INDEX IF NOT EXISTS "pricelistentry_fts_idx" ON "PriceListEntry" USING GIN (
  to_tsvector('italian',
    coalesce(code::text,'') || ' ' ||
    coalesce(description::text,'') || ' ' ||
    coalesce("shortDescription"::text,'') || ' ' ||
    coalesce(chapter::text,'') || ' ' ||
    coalesce(category::text,'') || ' ' ||
    coalesce("subCategory"::text,'') || ' ' ||
    coalesce(notes::text,'')
  )
);

-- QuoteLine ora può riferire una PriceListEntry
ALTER TABLE "QuoteLine" ADD COLUMN IF NOT EXISTS "priceListEntryId" TEXT;
ALTER TABLE "QuoteLine"
  ADD CONSTRAINT "QuoteLine_priceListEntry_fkey"
  FOREIGN KEY ("priceListEntryId") REFERENCES "PriceListEntry"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "QuoteLine_priceListEntryId_idx" ON "QuoteLine"("priceListEntryId");
