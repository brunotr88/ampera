import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Verifica che il contesto (customerId o plantId) appartenga al tenant corrente. */
async function assertContextOwnership(tenantId: string, customerId?: string, plantId?: string) {
  if (customerId) {
    const c = await db.customer.findFirst({ where: { id: customerId, tenantId }, select: { id: true } });
    if (!c) return false;
  }
  if (plantId) {
    const p = await db.plant.findFirst({ where: { id: plantId, tenantId }, select: { id: true } });
    if (!p) return false;
  }
  return true;
}

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const sp = req.nextUrl.searchParams;
  const customerId = sp.get("customerId") || undefined;
  const plantId = sp.get("plantId") || undefined;

  if (!customerId && !plantId) {
    return NextResponse.json({ error: "customerId or plantId required" }, { status: 400 });
  }

  const ok = await assertContextOwnership(s.tenantId, customerId, plantId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contacts = await db.contact.findMany({
    where: {
      OR: [
        ...(customerId ? [{ customerId }] : []),
        ...(plantId ? [{ plantId }] : []),
      ],
    },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const { customerId, plantId, name, surname, role, email, phone, mobile, isPrimary, notes } = body;

  if (!name || (!customerId && !plantId)) {
    return NextResponse.json({ error: "name + (customerId or plantId) required" }, { status: 400 });
  }

  const ok = await assertContextOwnership(s.tenantId, customerId, plantId);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isPrimary) {
    await db.contact.updateMany({
      where: { OR: [{ customerId: customerId || undefined }, { plantId: plantId || undefined }] },
      data: { isPrimary: false },
    });
  }

  const contact = await db.contact.create({
    data: { customerId: customerId || null, plantId: plantId || null, name, surname, role, email, phone, mobile, isPrimary: !!isPrimary, notes },
  });
  return NextResponse.json({ contact }, { status: 201 });
}
