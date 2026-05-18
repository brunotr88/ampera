/**
 * Mappa centralizzata: per ogni entità, i campi indicizzati in FTS.
 * Le stesse colonne sono usate sia per CREATE INDEX (migration) che per WHERE (runtime).
 * Cambiare qui = aggiornare la migration di seguito.
 *
 * NOTE: i nomi sono case-sensitive Postgres (quoted identifiers) tranne tutto-minuscolo.
 */

export type EntityName =
  | "Customer"
  | "Supplier"
  | "Plant"
  | "Project"
  | "WorkOrder"
  | "Report"
  | "Quote"
  | "Invoice"
  | "PurchaseOrder"
  | "PurchaseInvoice"
  | "Material"
  | "Vehicle"
  | "MaintenanceContract"
  | "CashbookEntry"
  | "IncentiveApplication"
  | "PrivacyDocument"
  | "ConformityDeclaration"
  | "AssetAcquisition";

export const SEARCH_FIELDS: Record<EntityName, string[]> = {
  Customer: ["name", "surname", "companyName", "vatNumber", "fiscalCode", "email", "phone", "mobile", "sdiCode", "pec", "notes"],
  Supplier: ["name", "vatNumber", "fiscalCode", "email", "phone", "address", "city", "province", "zip"],
  Plant: ["code", "name", "type", "certificationStatus", "notes"],
  Project: ["code", "name", "description", "rupName", "dlName", "cigCode", "cupCode", "notes"],
  WorkOrder: ["code", "title", "description", "type", "cause"],
  Report: ["code", "workType", "cause", "description"],
  Quote: ["number", "title", "description", "terms", "internalNotes"],
  Invoice: ["number", "series", "paymentMethod", "notes", "internalNotes", "sdiIdentifier"],
  PurchaseOrder: ["number", "notes", "internalNotes"],
  PurchaseInvoice: ["number", "series", "notes", "internalNotes"],
  Material: ["code", "metelCode", "barcode", "name", "brand", "category", "description"],
  Vehicle: ["plate", "brand", "model", "fuelType", "insuranceCompany", "insurancePolicyNo", "notes"],
  MaintenanceContract: ["name", "description"],
  CashbookEntry: ["category", "description", "counterpart", "documentRef", "paymentMethod", "notes"],
  IncentiveApplication: ["code", "workDescription", "bankTransferRef", "bankTransferDescription", "agenciaProtocol"],
  PrivacyDocument: ["audience", "subjectName", "subjectEmail", "subjectFiscalCode", "signerName"],
  ConformityDeclaration: ["number", "rtName", "rtRegistrationNo", "notes"],
  AssetAcquisition: ["code", "name", "description", "category", "serialNumber", "location", "invoiceRef", "notes"],
};

/** Quote identifier Postgres (camelCase) o lowercase senza virgolette */
function quoteIdent(col: string): string {
  return col === col.toLowerCase() ? col : `"${col}"`;
}

/** Costruisce l'espressione tsvector per WHERE/INDEX. Deve essere IDENTICA fra migration e query. */
export function buildTsVectorExpr(entity: EntityName, tableAlias = ""): string {
  const fields = SEARCH_FIELDS[entity];
  const prefix = tableAlias ? `${tableAlias}.` : "";
  const parts = fields.map(f => `coalesce(${prefix}${quoteIdent(f)},'')`).join(` || ' ' || `);
  return `to_tsvector('italian', ${parts})`;
}

/**
 * Trasforma una query utente in tsquery sicura con prefix matching.
 * "ross mar" → "ross:* & mar:*"
 * Sanifica caratteri speciali tsquery e parole vuote.
 */
export function buildTsQuery(q: string): string {
  const cleaned = q.trim();
  if (!cleaned) return "";
  const tokens = cleaned
    .split(/\s+/)
    .map(t => t.replace(/[!&|()<>:*'"\\]/g, ""))
    .filter(t => t.length > 0);
  if (tokens.length === 0) return "";
  return tokens.map(t => `${t}:*`).join(" & ");
}
