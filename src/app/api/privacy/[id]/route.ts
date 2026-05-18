import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { getPrivacyTemplate } from "@/lib/privacy-templates";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.signedAt && !body.allowSignedEdit) return NextResponse.json({ error: "Documento gia firmato. Crea nuova versione invece di modificare." }, { status: 423 });

  const data: any = {};
  for (const k of ["subjectName", "subjectEmail", "subjectFiscalCode", "contentHtml", "consentsJson", "customFieldsJson", "notes", "version"]) {
    if (k in body) data[k] = body[k];
  }
  if ("expiresAt" in body) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  // If regenerate flag, rebuild HTML from template
  if (body.regenerate) {
    const tpl = getPrivacyTemplate(doc.type);
    if (tpl) {
      const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
      const html = tpl.generateHtml({
        tenant: tenant as any,
        subject: body.subject || (doc.customFieldsJson as any)?.subject || {},
        dpoEmail: body.dpoEmail,
        customFields: body.customFields,
        consentDate: doc.createdAt,
      });
      data.contentHtml = html;
    }
  }

  const updated = await db.privacyDocument.update({ where: { id }, data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_UPDATE", entity: "PrivacyDocument", entityId: id });
  return NextResponse.json({ document: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.privacyDocument.delete({ where: { id } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_DELETE", entity: "PrivacyDocument", entityId: id });
  return NextResponse.json({ ok: true });
}
