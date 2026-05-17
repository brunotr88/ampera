import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const order = await db.purchaseOrder.findFirst({ where: { id, tenantId: s.tenantId }, include: { lines: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Receive items - mark received and create stock movements
  if (body.action === "receive" && Array.isArray(body.received)) {
    await db.$transaction(async (tx) => {
      for (const r of body.received) {
        const line = order.lines.find(l => l.id === r.lineId);
        if (!line) continue;
        await tx.purchaseOrderLine.update({ where: { id: line.id }, data: { receivedQty: r.quantity } });
        if (order.warehouseId && line.materialCode) {
          const material = await tx.material.findFirst({ where: { tenantId: s.tenantId, code: line.materialCode } });
          if (material) {
            await tx.stockMovement.create({
              data: {
                tenantId: s.tenantId, materialId: material.id, warehouseId: order.warehouseId,
                type: "IN", quantity: r.quantity, unitPrice: line.unitPrice, reference: order.number,
                userId: s.id, notes: `Carico da ordine ${order.number}`,
              },
            });
          }
        }
      }
      const all = await tx.purchaseOrderLine.findMany({ where: { orderId: id } });
      const fully = all.every(l => l.receivedQty >= l.quantity);
      const partial = all.some(l => l.receivedQty > 0);
      await tx.purchaseOrder.update({
        where: { id }, data: { receivedFully: fully, receivedDate: fully ? new Date() : null, status: fully ? "RECEIVED" : partial ? "PARTIAL" : order.status },
      });
    });
    await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PO_RECEIVE", entity: "PurchaseOrder", entityId: id });
    return NextResponse.json({ ok: true });
  }

  const updated = await db.purchaseOrder.update({ where: { id }, data: body });
  return NextResponse.json({ order: updated });
}
