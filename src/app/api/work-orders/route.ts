import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { WorkOrderCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const assignedToMe = req.nextUrl.searchParams.get("mine") === "1";
  const fromDate = req.nextUrl.searchParams.get("from");
  const toDate = req.nextUrl.searchParams.get("to");
  const status = req.nextUrl.searchParams.get("status");
  const workOrders = await db.workOrder.findMany({
    where: {
      tenantId: s.tenantId, deletedAt: null,
      ...(assignedToMe ? { assignedToId: s.id } : {}),
      ...(fromDate ? { scheduledDate: { gte: new Date(fromDate) } } : {}),
      ...(toDate ? { scheduledDate: { lte: new Date(toDate) } } : {}),
      ...(status ? { status: status as any } : {}),
    },
    include: { customer: true, plant: true, site: true, assignedTo: true, report: { select: { id: true, status: true } } },
    orderBy: { scheduledDate: "asc" },
    take: 200,
  });
  return NextResponse.json({ workOrders });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = WorkOrderCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const last = await db.workOrder.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" }, select: { code: true } });
  const n = last ? parseInt((last.code || "0").replace(/\D/g, "")) + 1 : 1;
  const code = `WO-${String(n).padStart(5, "0")}`;
  const created = await db.workOrder.create({ data: { tenantId: s.tenantId, code, ...parsed.data } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "WorkOrder", entityId: created.id });
  return NextResponse.json({ workOrder: created }, { status: 201 });
}
