import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const p = await db.plant.findFirst({ where: { id, tenantId: s.tenantId, deletedAt: null } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.plant.update({ where: { id }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "Plant", entityId: id });
  return NextResponse.json({ plant: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  await db.plant.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Plant", entityId: id });
  return NextResponse.json({ ok: true });
}
