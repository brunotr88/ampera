import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { MaterialCreate } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const q = req.nextUrl.searchParams.get("q") || "";
  const barcode = req.nextUrl.searchParams.get("barcode");
  const materials = await db.material.findMany({
    where: {
      tenantId: s.tenantId, deletedAt: null, active: true,
      ...(barcode ? { OR: [{ barcode }, { metelCode: barcode }, { code: barcode }] } : {}),
      ...(q ? { OR: [
        { code: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { metelCode: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { name: "asc" },
    take: 100,
  });
  return NextResponse.json({ materials });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = MaterialCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const m = await db.material.create({ data: { tenantId: s.tenantId, ...parsed.data } });
  return NextResponse.json({ material: m }, { status: 201 });
}
