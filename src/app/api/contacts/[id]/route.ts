import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

async function loadOwned(tenantId: string, id: string) {
  const contact = await db.contact.findFirst({
    where: {
      id,
      OR: [
        { customer: { tenantId } },
        { plant: { tenantId } },
      ],
    },
  });
  return contact;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await loadOwned(s.tenantId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  if (body.isPrimary) {
    const scope: any = existing.customerId ? { customerId: existing.customerId } : { plantId: existing.plantId };
    await db.contact.updateMany({ where: { ...scope, NOT: { id } }, data: { isPrimary: false } });
  }

  const contact = await db.contact.update({
    where: { id },
    data: {
      name: body.name ?? existing.name,
      surname: body.surname ?? existing.surname,
      role: body.role ?? existing.role,
      email: body.email ?? existing.email,
      phone: body.phone ?? existing.phone,
      mobile: body.mobile ?? existing.mobile,
      isPrimary: body.isPrimary ?? existing.isPrimary,
      notes: body.notes ?? existing.notes,
    },
  });
  return NextResponse.json({ contact });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const existing = await loadOwned(s.tenantId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
