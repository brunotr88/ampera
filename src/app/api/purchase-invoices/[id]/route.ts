import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const invoice = await db.purchaseInvoice.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { lines: true },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const supplier = await db.supplier.findUnique({ where: { id: invoice.supplierId }, select: { id: true, name: true } });
  return NextResponse.json({ invoice: { ...invoice, supplier } });
}
