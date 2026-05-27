import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { notifyClientOnStateChange } from "@/lib/workflow-notify";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const wo = await db.workOrder.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const previousCustomStateId = wo.customStateId;
  const updated = await db.workOrder.update({ where: { id }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "WorkOrder", entityId: id });

  // Hook: cambio customStateId triggera notifica cliente se il nuovo stato ha triggersClientEmail
  let notification: any = null;
  if ("customStateId" in body && updated.customStateId && updated.customStateId !== previousCustomStateId) {
    notification = await notifyClientOnStateChange(id, updated.customStateId, previousCustomStateId);
  }

  return NextResponse.json({ workOrder: updated, notification });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const wo = await db.workOrder.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.workOrder.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "WorkOrder", entityId: id });
  return NextResponse.json({ ok: true });
}
