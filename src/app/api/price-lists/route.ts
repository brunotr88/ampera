import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const lists = await db.priceList.findMany({
    where: { tenantId: s.tenantId },
    orderBy: [{ isDefault: "desc" }, { year: "desc" }, { name: "asc" }],
    include: { _count: { select: { entries: true } } },
  });
  return NextResponse.json({ lists });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  if (!body.name || !body.year) return NextResponse.json({ error: "name + year required" }, { status: 400 });

  if (body.isDefault) {
    await db.priceList.updateMany({ where: { tenantId: s.tenantId }, data: { isDefault: false } });
  }

  const list = await db.priceList.create({
    data: {
      tenantId: s.tenantId,
      name: body.name,
      source: body.source || "DEI",
      year: Number(body.year),
      active: body.active ?? true,
      isDefault: !!body.isDefault,
      description: body.description,
    },
  });
  return NextResponse.json({ list }, { status: 201 });
}
