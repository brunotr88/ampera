import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const list = await db.priceList.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { _count: { select: { entries: true } } },
  });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ list });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const existing = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.isDefault) {
    await db.priceList.updateMany({ where: { tenantId: s.tenantId, NOT: { id } }, data: { isDefault: false } });
  }

  const list = await db.priceList.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      source: body.source ?? existing.source,
      year: body.year ?? existing.year,
      active: body.active ?? existing.active,
      isDefault: body.isDefault ?? existing.isDefault,
      description: body.description ?? existing.description,
    },
  });
  return NextResponse.json({ list });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.priceList.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
