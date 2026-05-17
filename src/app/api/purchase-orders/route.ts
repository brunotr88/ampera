import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { PurchaseOrderCreate } from "@/lib/validators";
import { calcVatBreakdown, round2 } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const orders = await db.purchaseOrder.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { supplier: true, lines: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = PurchaseOrderCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const last = await db.purchaseOrder.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" }, select: { number: true } });
  const n = last ? parseInt((last.number || "0").replace(/\D/g, "")) + 1 : 1;
  const number = `PO-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;

  const totals = calcVatBreakdown(data.lines.map(l => ({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: 0, vatRate: l.vatRate })));
  const total = round2(totals.subtotal + totals.vat + data.shippingCost);

  const order = await db.purchaseOrder.create({
    data: {
      tenantId: s.tenantId, supplierId: data.supplierId, number,
      expectedDate: data.expectedDate, projectId: data.projectId, warehouseId: data.warehouseId,
      shippingCost: data.shippingCost, notes: data.notes, createdById: s.id,
      subtotal: totals.subtotal, vatTotal: totals.vat, total,
      lines: { create: data.lines.map((l, i) => ({
        position: i + 1, materialCode: l.materialCode, description: l.description,
        quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, vatRate: l.vatRate,
        total: round2(l.quantity * l.unitPrice * (1 + l.vatRate / 100)),
      })) },
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "PurchaseOrder", entityId: order.id });
  return NextResponse.json({ order }, { status: 201 });
}
