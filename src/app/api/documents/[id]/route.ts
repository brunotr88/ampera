import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { template: true },
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.signedAt && !((await req.json()).allowSignedEdit)) {
    return NextResponse.json({ error: "Documento firmato, non modificabile" }, { status: 423 });
  }

  const body = await req.clone().json();
  const doc = await db.amperaDocument.update({
    where: { id },
    data: {
      title: body.title ?? existing.title,
      contentHtml: body.contentHtml ?? existing.contentHtml,
      status: body.status ?? existing.status,
      sentTo: body.sentTo ?? existing.sentTo,
      revokedAt: body.revoke ? new Date() : existing.revokedAt,
      revokedReason: body.revokedReason ?? existing.revokedReason,
      customFieldsJson: body.customFields ? JSON.stringify(body.customFields) : existing.customFieldsJson,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "AmperaDocument", entityId: id });
  return NextResponse.json({ document: doc });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (existing.signedAt) return NextResponse.json({ error: "Documento firmato: usa revoca" }, { status: 423 });
  await db.amperaDocument.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "AmperaDocument", entityId: id });
  return NextResponse.json({ ok: true });
}
