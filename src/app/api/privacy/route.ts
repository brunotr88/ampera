import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { PRIVACY_TEMPLATES, getPrivacyTemplate } from "@/lib/privacy-templates";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const customerId = req.nextUrl.searchParams.get("customerId");
  const userId = req.nextUrl.searchParams.get("userId");
  const docs = await db.privacyDocument.findMany({
    where: { tenantId: s.tenantId, ...(customerId ? { customerId } : {}), ...(userId ? { userId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ documents: docs, templates: PRIVACY_TEMPLATES.map(t => ({ type: t.type, title: t.title, description: t.description, audience: t.audience, consentRequired: t.consentRequired })) });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const tpl = getPrivacyTemplate(body.type);
  if (!tpl) return NextResponse.json({ error: "Tipo non valido" }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const html = tpl.generateHtml({
    tenant: { name: tenant.name, vatNumber: tenant.vatNumber, fiscalCode: tenant.fiscalCode, address: tenant.address, city: tenant.city, province: tenant.province, zip: tenant.zip, email: tenant.email, phone: tenant.phone, pec: tenant.pec },
    subject: { name: body.subjectName, fiscalCode: body.subjectFiscalCode, email: body.subjectEmail },
    dpoEmail: body.dpoEmail,
  });

  const doc = await db.privacyDocument.create({
    data: {
      tenantId: s.tenantId, type: body.type as any, audience: tpl.audience,
      subjectName: body.subjectName, subjectEmail: body.subjectEmail, subjectFiscalCode: body.subjectFiscalCode,
      customerId: body.customerId, userId: body.userId,
      version: body.version || "1.0",
      contentHtml: html,
      consentsJson: body.consents || null,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_GENERATE", entity: "PrivacyDocument", entityId: doc.id, meta: { type: body.type } });
  return NextResponse.json({ document: doc }, { status: 201 });
}
