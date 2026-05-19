import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { DEMO_PRICE_LIST_ENTRIES } from "@/lib/price-list-seed";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const list = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let created = 0, skipped = 0;
  for (const e of DEMO_PRICE_LIST_ENTRIES) {
    const existing = await db.priceListEntry.findUnique({
      where: { priceListId_code: { priceListId: id, code: e.code } },
    });
    if (existing) { skipped++; continue; }
    await db.priceListEntry.create({
      data: {
        priceListId: id,
        tenantId: s.tenantId,
        code: e.code,
        chapter: e.chapter,
        category: e.category,
        subCategory: e.subCategory || null,
        description: e.description,
        unit: e.unit,
        unitPrice: e.unitPrice,
        materialCost: e.materialCost ?? null,
        laborCost: e.laborCost ?? null,
        laborHours: e.laborHours ?? null,
      },
    });
    created++;
  }

  const total = await db.priceListEntry.count({ where: { priceListId: id } });
  await db.priceList.update({ where: { id }, data: { totalEntries: total } });
  return NextResponse.json({ created, skipped, total });
}
