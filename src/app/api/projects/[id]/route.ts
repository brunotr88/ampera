import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const p = await db.project.findFirst({ where: { id, tenantId: s.tenantId, deletedAt: null } });
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.project.update({ where: { id }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "Project", entityId: id });
  return NextResponse.json({ project: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  await db.project.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Project", entityId: id });
  return NextResponse.json({ ok: true });
}
