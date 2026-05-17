import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id: vehicleId } = await params;
  const body = await req.json();
  const v = await db.vehicle.findFirst({ where: { id: vehicleId, tenantId: s.tenantId } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await db.vehicleLog.create({
    data: {
      vehicleId, userId: s.id,
      type: body.type, date: new Date(body.date || Date.now()),
      km: body.km ? Number(body.km) : null,
      cost: body.cost ? Number(body.cost) : null,
      description: body.description || body.type,
      invoiceRef: body.invoiceRef,
      nextDueDate: body.nextDueDate ? new Date(body.nextDueDate) : null,
      nextDueKm: body.nextDueKm ? Number(body.nextDueKm) : null,
    },
  });

  // Update vehicle current km / expiry dates based on log type
  const updates: any = {};
  if (log.km && log.km > v.currentKm) updates.currentKm = log.km;
  if (log.type === "MAINTENANCE" && log.nextDueDate) updates.maintenanceExpiry = log.nextDueDate;
  if (log.type === "MAINTENANCE" && log.nextDueKm) updates.maintenanceKmDue = log.nextDueKm;
  if (log.type === "INSPECTION" && log.nextDueDate) updates.inspectionExpiry = log.nextDueDate;
  if (log.type === "INSURANCE_RENEWAL" && log.nextDueDate) updates.insuranceExpiry = log.nextDueDate;
  if (Object.keys(updates).length) await db.vehicle.update({ where: { id: vehicleId }, data: updates });

  return NextResponse.json({ log }, { status: 201 });
}
