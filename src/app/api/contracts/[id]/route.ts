import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const c = await db.maintenanceContract.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.maintenanceContract.update({ where: { id }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "MaintenanceContract", entityId: id });
  return NextResponse.json({ contract: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const c = await db.maintenanceContract.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.maintenanceContract.update({ where: { id }, data: { active: false } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "MaintenanceContract", entityId: id });
  return NextResponse.json({ ok: true });
}
