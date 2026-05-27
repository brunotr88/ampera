import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.workflowState.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const state = await db.workflowState.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      color: body.color ?? existing.color,
      icon: body.icon ?? existing.icon,
      percentage: body.percentage != null ? Number(body.percentage) : existing.percentage,
      sortOrder: body.sortOrder != null ? Number(body.sortOrder) : existing.sortOrder,
      isFinal: body.isFinal ?? existing.isFinal,
      isActive: body.isActive ?? existing.isActive,
      triggersClientEmail: body.triggersClientEmail ?? existing.triggersClientEmail,
      emailSubject: body.emailSubject ?? existing.emailSubject,
      emailBodyHtml: body.emailBodyHtml ?? existing.emailBodyHtml,
    },
  });
  return NextResponse.json({ state });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.workflowState.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verifica se è in uso
  const inUse = await db.workOrder.count({ where: { tenantId: s.tenantId, customStateId: id } });
  if (inUse > 0) {
    return NextResponse.json({ error: `Stato in uso da ${inUse} interventi. Disattivalo invece di eliminarlo.` }, { status: 409 });
  }

  await db.workflowState.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
