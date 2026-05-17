import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const vehicles = await db.vehicle.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { assignedTo: true, _count: { select: { logs: true } } },
    orderBy: { plate: "asc" },
  });
  return NextResponse.json({ vehicles });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  if (!body.plate) return NextResponse.json({ error: "plate required" }, { status: 400 });
  const v = await db.vehicle.create({
    data: {
      tenantId: s.tenantId,
      plate: body.plate.toUpperCase().replace(/\s/g, ""),
      brand: body.brand,
      model: body.model,
      type: body.type || "VAN",
      year: body.year ? Number(body.year) : null,
      fuelType: body.fuelType,
      currentKm: Number(body.currentKm || 0),
      registrationDate: body.registrationDate ? new Date(body.registrationDate) : null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : null,
      insuranceCompany: body.insuranceCompany,
      insurancePolicyNo: body.insurancePolicyNo,
      insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry) : null,
      inspectionExpiry: body.inspectionExpiry ? new Date(body.inspectionExpiry) : null,
      maintenanceExpiry: body.maintenanceExpiry ? new Date(body.maintenanceExpiry) : null,
      maintenanceKmDue: body.maintenanceKmDue ? Number(body.maintenanceKmDue) : null,
      bolloExpiry: body.bolloExpiry ? new Date(body.bolloExpiry) : null,
      assignedToId: body.assignedToId || null,
      notes: body.notes,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Vehicle", entityId: v.id });
  return NextResponse.json({ vehicle: v }, { status: 201 });
}
