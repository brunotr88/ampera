/**
 * Compliance dashboard: for each entity (customer/supplier/employee), list which privacy documents are
 * present/missing/expired/revoked. Returns coverage matrix.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

// Required documents per entity type
const REQUIRED: Record<string, string[]> = {
  customer: ["CUSTOMER_INFORMATIVE"],
  supplier: ["CONTRACTOR_NDA"],
  employee: ["EMPLOYEE_INFORMATIVE"],
};

const OPTIONAL: Record<string, string[]> = {
  customer: ["CUSTOMER_CONSENT", "MARKETING_CONSENT"],
  supplier: ["DATA_PROCESSING_AGREEMENT"],
  employee: ["EMPLOYEE_CONSENT", "GEO_TRACKING_CONSENT"],
};

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const entityType = req.nextUrl.searchParams.get("entityType") || "customer";

  let entities: any[] = [];
  if (entityType === "customer") {
    entities = await db.customer.findMany({
      where: { tenantId: s.tenantId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, surname: true, companyName: true, email: true, type: true, gdprConsent: true, gdprConsentAt: true },
      orderBy: { createdAt: "desc" },
    });
  } else if (entityType === "supplier") {
    entities = await db.supplier.findMany({
      where: { tenantId: s.tenantId, deletedAt: null, active: true },
      select: { id: true, name: true, email: true, vatNumber: true },
    });
  } else if (entityType === "employee") {
    entities = await db.user.findMany({
      where: { tenantId: s.tenantId, active: true, role: { in: ["OWNER", "ADMIN", "OFFICE", "TECHNICIAN"] } },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  // Fetch all docs for these entities
  const ids = entities.map(e => e.id);
  const idField = entityType === "customer" ? "customerId" : entityType === "supplier" ? "supplierId" : "userId";
  const docs: any[] = await db.privacyDocument.findMany({
    where: { tenantId: s.tenantId, [idField]: { in: ids } },
    select: { id: true, type: true, customerId: true, supplierId: true, userId: true, signedAt: true, revokedAt: true, expiresAt: true, createdAt: true },
  });

  const required = REQUIRED[entityType] || [];
  const optional = OPTIONAL[entityType] || [];
  const all = [...required, ...optional];

  const result = entities.map(e => {
    const myDocs = docs.filter((d: any) => d[idField] === e.id);
    const coverage: Record<string, any> = {};
    for (const docType of all) {
      const d = myDocs.find(x => x.type === docType);
      if (!d) {
        coverage[docType] = { status: "missing" };
      } else if (d.revokedAt) {
        coverage[docType] = { status: "revoked", id: d.id };
      } else if (d.expiresAt && d.expiresAt < new Date()) {
        coverage[docType] = { status: "expired", id: d.id };
      } else if (d.signedAt) {
        coverage[docType] = { status: "signed", id: d.id, signedAt: d.signedAt };
      } else {
        coverage[docType] = { status: "unsigned", id: d.id };
      }
    }
    const missingRequired = required.filter(r => coverage[r].status === "missing" || coverage[r].status === "revoked" || coverage[r].status === "expired").length;
    return {
      ...e,
      coverage,
      missingRequired,
      isCompliant: missingRequired === 0,
    };
  });

  const totalEntities = result.length;
  const compliant = result.filter(r => r.isCompliant).length;
  const compliancePercentage = totalEntities > 0 ? Math.round((compliant / totalEntities) * 100) : 100;

  return NextResponse.json({
    entityType,
    entities: result,
    requiredTypes: required,
    optionalTypes: optional,
    summary: { total: totalEntities, compliant, nonCompliant: totalEntities - compliant, compliancePercentage },
  });
}
