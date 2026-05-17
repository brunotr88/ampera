import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { PlantCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const customerId = req.nextUrl.searchParams.get("customerId");
  const plants = await db.plant.findMany({
    where: { tenantId: s.tenantId, deletedAt: null, ...(customerId ? { customerId } : {}) },
    include: { customer: true, site: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ plants });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = PlantCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const created = await db.plant.create({ data: { tenantId: s.tenantId, ...parsed.data } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Plant", entityId: created.id });
  return NextResponse.json({ plant: created }, { status: 201 });
}
