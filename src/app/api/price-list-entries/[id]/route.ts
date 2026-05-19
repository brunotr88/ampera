import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const entry = await db.priceListEntry.findFirst({ where: { id, tenantId: s.tenantId }, include: { priceList: true } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ entry });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.priceListEntry.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const entry = await db.priceListEntry.update({
    where: { id },
    data: {
      code: body.code ?? existing.code,
      chapter: body.chapter ?? existing.chapter,
      category: body.category ?? existing.category,
      subCategory: body.subCategory ?? existing.subCategory,
      description: body.description ?? existing.description,
      shortDescription: body.shortDescription ?? existing.shortDescription,
      unit: body.unit ?? existing.unit,
      unitPrice: body.unitPrice != null ? Number(body.unitPrice) : existing.unitPrice,
      materialCost: body.materialCost != null ? Number(body.materialCost) : existing.materialCost,
      laborCost: body.laborCost != null ? Number(body.laborCost) : existing.laborCost,
      laborHours: body.laborHours != null ? Number(body.laborHours) : existing.laborHours,
      laborRate: body.laborRate != null ? Number(body.laborRate) : existing.laborRate,
      equipmentCost: body.equipmentCost != null ? Number(body.equipmentCost) : existing.equipmentCost,
      notes: body.notes ?? existing.notes,
      active: body.active ?? existing.active,
    },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.priceListEntry.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.priceListEntry.delete({ where: { id } });
  await db.priceList.update({ where: { id: existing.priceListId }, data: { totalEntries: { decrement: 1 } } });
  return NextResponse.json({ ok: true });
}
