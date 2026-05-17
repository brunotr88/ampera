import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const d = await db.conformityDeclaration.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { plant: { include: { customer: true } } },
  });
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ dico: d });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const d = await db.conformityDeclaration.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.conformityDeclaration.update({ where: { id }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "ConformityDeclaration", entityId: id });
  return NextResponse.json({ dico: updated });
}
