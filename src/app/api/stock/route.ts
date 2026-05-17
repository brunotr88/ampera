/**
 * Inventario corrente: somma movimenti per (material, warehouse).
 * Stock = sum(IN) + sum(RETURN) - sum(OUT) per ogni materialId/warehouseId.
 * TRANSFER non sposta tra magazzini (è un movement separato, già IN/OUT).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const warehouseId = req.nextUrl.searchParams.get("warehouseId");
  const category = req.nextUrl.searchParams.get("category");
  const q = req.nextUrl.searchParams.get("q") || "";

  // 1) Fetch materials
  const materials = await db.material.findMany({
    where: {
      tenantId: s.tenantId, deletedAt: null, active: true,
      ...(category ? { category } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { metelCode: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { name: "asc" },
    take: 500,
  });

  // 2) Fetch all movements grouped by material+warehouse
  const movements = await db.stockMovement.groupBy({
    by: ["materialId", "warehouseId", "type"],
    where: {
      tenantId: s.tenantId,
      materialId: { in: materials.map(m => m.id) },
      ...(warehouseId ? { warehouseId } : {}),
    },
    _sum: { quantity: true },
  });

  // 3) Reduce to net stock per (material, warehouse)
  const stockMap = new Map<string, number>();
  for (const m of movements) {
    const key = `${m.materialId}|${m.warehouseId}`;
    const sign = m.type === "IN" || m.type === "RETURN" || m.type === "ADJUSTMENT" ? 1 : -1;
    stockMap.set(key, (stockMap.get(key) || 0) + (m._sum.quantity || 0) * sign);
  }

  // 4) Fetch warehouses
  const warehouses = await db.warehouse.findMany({
    where: { tenantId: s.tenantId, active: true, ...(warehouseId ? { id: warehouseId } : {}) },
    include: { assignedTo: true },
    orderBy: { name: "asc" },
  });

  // 5) Build inventory matrix
  const inventory = materials.map(m => {
    const perWarehouse = warehouses.map(w => ({ warehouseId: w.id, qty: stockMap.get(`${m.id}|${w.id}`) || 0 }));
    const totalStock = perWarehouse.reduce((s, p) => s + p.qty, 0);
    return { ...m, perWarehouse, totalStock, belowMin: totalStock < m.stockMin };
  });

  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))].sort();
  return NextResponse.json({ inventory, warehouses, categories });
}
