import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { PRIVACY_TEMPLATES, getPrivacyTemplate } from "@/lib/privacy-templates";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const customerId = req.nextUrl.searchParams.get("customerId");
  const supplierId = req.nextUrl.searchParams.get("supplierId");
  const userId = req.nextUrl.searchParams.get("userId");
  const type = req.nextUrl.searchParams.get("type");
  const status = req.nextUrl.searchParams.get("status"); // signed|unsigned|revoked|all

  const where: any = { tenantId: s.tenantId };
  if (customerId) where.customerId = customerId;
  if (supplierId) where.supplierId = supplierId;
  if (userId) where.userId = userId;
  if (type) where.type = type;
  if (status === "signed") where.signedAt = { not: null };
  if (status === "unsigned") where.signedAt = null;
  if (status === "revoked") where.revokedAt = { not: null };

  const docs = await db.privacyDocument.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({
    documents: docs,
    templates: PRIVACY_TEMPLATES.map(t => ({ type: t.type, title: t.title, description: t.description, audience: t.audience, consentRequired: t.consentRequired })),
  });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const tpl = getPrivacyTemplate(body.type);
  if (!tpl) return NextResponse.json({ error: "Tipo non valido" }, { status: 400 });
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Auto-fill subject from entity if provided
  let subject: any = body.subject || {};
  if (body.customerId && !subject.name) {
    const c = await db.customer.findFirst({ where: { id: body.customerId, tenantId: s.tenantId } });
    if (c) {
      const addr = await db.address.findFirst({ where: { customerId: c.id, isDefault: true } });
      subject = { name: c.name, surname: c.surname, companyName: c.companyName, fiscalCode: c.fiscalCode, vatNumber: c.vatNumber, email: c.email, phone: c.phone, address: addr?.street, city: addr?.city, ...subject };
    }
  } else if (body.supplierId && !subject.name) {
    const sup = await db.supplier.findFirst({ where: { id: body.supplierId, tenantId: s.tenantId } });
    if (sup) subject = { name: sup.contactName || sup.name, companyName: sup.name, fiscalCode: sup.fiscalCode, vatNumber: sup.vatNumber, email: sup.email, phone: sup.phone, address: sup.address, city: sup.city, ...subject };
  } else if (body.userId && !subject.name) {
    const u = await db.user.findFirst({ where: { id: body.userId, tenantId: s.tenantId } });
    if (u) subject = { name: u.name.split(" ")[0], surname: u.name.split(" ").slice(1).join(" "), email: u.email, phone: u.phoneNumber, role: u.role, ...subject };
  }

  const html = tpl.generateHtml({
    tenant: { name: tenant.name, vatNumber: tenant.vatNumber, fiscalCode: tenant.fiscalCode, address: tenant.address, city: tenant.city, province: tenant.province, zip: tenant.zip, email: tenant.email, phone: tenant.phone, pec: tenant.pec },
    subject,
    dpoEmail: body.dpoEmail,
    customFields: body.customFields,
    consentDate: new Date(),
  });

  const doc = await db.privacyDocument.create({
    data: {
      tenantId: s.tenantId,
      type: body.type as any,
      audience: tpl.audience,
      subjectName: subject.companyName || `${subject.name || ""} ${subject.surname || ""}`.trim() || body.subjectName,
      subjectEmail: subject.email || body.subjectEmail,
      subjectFiscalCode: subject.fiscalCode || body.subjectFiscalCode,
      customerId: body.customerId || null,
      supplierId: body.supplierId || null,
      userId: body.userId || null,
      version: body.version || "1.0",
      contentHtml: html,
      consentsJson: body.consents || null,
      customFieldsJson: body.customFields || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      notes: body.notes,
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_GENERATE", entity: "PrivacyDocument", entityId: doc.id, meta: { type: body.type, subject: doc.subjectName } });
  return NextResponse.json({ document: doc }, { status: 201 });
}
