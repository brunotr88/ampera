import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const m = await db.material.findFirst({ where: { id, tenantId: s.tenantId, deletedAt: null } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ material: m });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const m = await db.material.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!m) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: any = {};
  for (const k of ["name", "code", "metelCode", "barcode", "brand", "category", "description", "unit"]) {
    if (k in body) data[k] = body[k];
  }
  for (const k of ["unitPrice", "purchasePrice", "vatRate", "marginPercent", "stockMin"]) {
    if (k in body) data[k] = Number(body[k]);
  }
  const updated = await db.material.update({ where: { id }, data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "Material", entityId: id });
  return NextResponse.json({ material: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  await db.material.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Material", entityId: id });
  return NextResponse.json({ ok: true });
}
