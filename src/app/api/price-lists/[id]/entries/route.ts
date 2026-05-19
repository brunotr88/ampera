import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const list = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId }, select: { id: true } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const chapter = sp.get("chapter") || undefined;
  const take = Math.min(parseInt(sp.get("take") || "50"), 200);

  const entries = await db.priceListEntry.findMany({
    where: {
      priceListId: id,
      active: true,
      ...(chapter ? { chapter } : {}),
      ...(q ? {
        OR: [
          { code: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: [{ chapter: "asc" }, { code: "asc" }],
    take,
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const list = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  if (!body.code || !body.description) return NextResponse.json({ error: "code + description required" }, { status: 400 });

  const entry = await db.priceListEntry.create({
    data: {
      priceListId: id,
      tenantId: s.tenantId,
      code: body.code,
      chapter: body.chapter,
      category: body.category,
      subCategory: body.subCategory,
      description: body.description,
      shortDescription: body.shortDescription,
      unit: body.unit || "pz",
      unitPrice: Number(body.unitPrice || 0),
      materialCost: body.materialCost != null ? Number(body.materialCost) : null,
      laborCost: body.laborCost != null ? Number(body.laborCost) : null,
      laborHours: body.laborHours != null ? Number(body.laborHours) : null,
      laborRate: body.laborRate != null ? Number(body.laborRate) : null,
      equipmentCost: body.equipmentCost != null ? Number(body.equipmentCost) : null,
      notes: body.notes,
    },
  });

  await db.priceList.update({ where: { id }, data: { totalEntries: { increment: 1 } } });
  return NextResponse.json({ entry }, { status: 201 });
}
