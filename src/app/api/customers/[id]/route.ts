import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { CustomerCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const customer = await db.customer.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { contacts: true, addresses: true, plants: true, sites: true },
  });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ customer });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const parsed = CustomerCreate.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const customer = await db.customer.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.customer.update({ where: { id }, data: parsed.data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "Customer", entityId: id });
  return NextResponse.json({ customer: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const customer = await db.customer.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.customer.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Customer", entityId: id });
  return NextResponse.json({ ok: true });
}
