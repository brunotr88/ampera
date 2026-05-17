import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const boxes = await db.cashbox.findMany({ where: { tenantId: s.tenantId, active: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ cashboxes: boxes });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const box = await db.cashbox.create({
    data: {
      tenantId: s.tenantId,
      name: body.name, type: body.type || "CASH",
      initialBalance: Number(body.initialBalance || 0), currentBalance: Number(body.initialBalance || 0),
      currency: body.currency || "EUR", notes: body.notes,
    },
  });
  return NextResponse.json({ cashbox: box }, { status: 201 });
}
