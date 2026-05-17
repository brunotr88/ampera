import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const warehouses = await db.warehouse.findMany({ where: { tenantId: s.tenantId, active: true }, include: { assignedTo: true } });
  return NextResponse.json({ warehouses });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const w = await db.warehouse.create({
    data: { tenantId: s.tenantId, name: body.name, type: body.type || "HQ", address: body.address, assignedToId: body.assignedToId },
  });
  return NextResponse.json({ warehouse: w }, { status: 201 });
}
