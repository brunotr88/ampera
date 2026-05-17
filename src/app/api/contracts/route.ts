import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const contracts = await db.maintenanceContract.findMany({
    where: { tenantId: s.tenantId },
    include: { customer: true, plant: true },
    orderBy: { nextDueDate: "asc" },
  });
  return NextResponse.json({ contracts });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const c = await db.maintenanceContract.create({
    data: {
      tenantId: s.tenantId,
      customerId: body.customerId,
      plantId: body.plantId || null,
      name: body.name,
      description: body.description,
      frequencyMonths: Number(body.frequencyMonths || 12),
      nextDueDate: new Date(body.nextDueDate),
      feeMonthly: Number(body.feeMonthly || 0),
      autoInvoice: !!body.autoInvoice,
      startDate: new Date(body.startDate || Date.now()),
      endDate: body.endDate ? new Date(body.endDate) : null,
      notifyDaysBefore: Number(body.notifyDaysBefore || 30),
      active: true,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "MaintenanceContract", entityId: c.id });
  return NextResponse.json({ contract: c }, { status: 201 });
}
