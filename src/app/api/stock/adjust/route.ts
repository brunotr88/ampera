/**
 * Manual stock adjustment: creates an ADJUSTMENT movement to align computed stock to a target value.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const { materialId, warehouseId, newQty, notes } = await req.json();
  if (!materialId || !warehouseId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Compute current stock
  const movs = await db.stockMovement.findMany({ where: { tenantId: s.tenantId, materialId, warehouseId } });
  let current = 0;
  for (const m of movs) {
    current += (m.type === "IN" || m.type === "RETURN" || m.type === "ADJUSTMENT" ? 1 : -1) * m.quantity;
  }
  const delta = Number(newQty) - current;
  if (Math.abs(delta) < 0.0001) return NextResponse.json({ ok: true, noChange: true });

  await db.stockMovement.create({
    data: {
      tenantId: s.tenantId, materialId, warehouseId,
      type: delta > 0 ? "ADJUSTMENT" : "OUT",
      quantity: Math.abs(delta), unitPrice: 0,
      reference: "MANUAL_ADJUST", userId: s.id,
      notes: notes || `Rettifica manuale: da ${current} a ${newQty}`,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "STOCK_ADJUST", entity: "Material", entityId: materialId, meta: { warehouseId, from: current, to: newQty, delta } });
  return NextResponse.json({ ok: true, delta, newStock: Number(newQty) });
}
