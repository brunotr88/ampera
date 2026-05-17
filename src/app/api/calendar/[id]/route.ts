import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const event = await db.calendarEvent.findFirst({ where: { id, tenantId: s.tenantId }, include: { owner: true } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const e = await db.calendarEvent.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: any = {};
  for (const k of ["title", "description", "type", "startsAt", "endsAt", "allDay", "location", "color", "customerId", "projectId", "workOrderId", "reminderMinutesBefore", "status"]) {
    if (k in body) data[k] = (k === "startsAt" || k === "endsAt") ? new Date(body[k]) : body[k];
  }
  const updated = await db.calendarEvent.update({ where: { id }, data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "CalendarEvent", entityId: id });
  return NextResponse.json({ event: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const e = await db.calendarEvent.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!e) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.calendarEvent.delete({ where: { id } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "CalendarEvent", entityId: id });
  return NextResponse.json({ ok: true });
}
