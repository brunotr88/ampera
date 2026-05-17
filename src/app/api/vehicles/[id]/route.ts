import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const v = await db.vehicle.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { assignedTo: true, logs: { orderBy: { date: "desc" }, take: 50, include: { user: true } } },
  });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ vehicle: v });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const v = await db.vehicle.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: any = {};
  for (const k of ["plate", "brand", "model", "type", "fuelType", "currentKm", "notes", "assignedToId", "insuranceCompany", "insurancePolicyNo", "maintenanceKmDue", "active"]) {
    if (k in body) data[k] = (k === "currentKm" || k === "maintenanceKmDue") ? (body[k] === null ? null : Number(body[k])) : body[k];
  }
  for (const k of ["registrationDate", "purchaseDate", "insuranceExpiry", "inspectionExpiry", "maintenanceExpiry", "bolloExpiry", "tachographExpiry"]) {
    if (k in body) data[k] = body[k] ? new Date(body[k]) : null;
  }
  if ("purchasePrice" in body) data.purchasePrice = body.purchasePrice ? Number(body.purchasePrice) : null;
  if ("year" in body) data.year = body.year ? Number(body.year) : null;
  const updated = await db.vehicle.update({ where: { id }, data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "Vehicle", entityId: id });
  return NextResponse.json({ vehicle: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  await db.vehicle.update({ where: { id }, data: { deletedAt: new Date(), active: false } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Vehicle", entityId: id });
  return NextResponse.json({ ok: true });
}
