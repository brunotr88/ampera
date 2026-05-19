import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { buildTsQuery, buildTsVectorExpr } from "@/lib/search-fields";

export const dynamic = "force-dynamic";

/** Global picker endpoint: cerca voci nel listino di default (o nel listino specificato). */
export async function GET(req: NextRequest) {
  const s = await requireSession();
  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() || "";
  const priceListId = sp.get("priceListId");
  const take = Math.min(parseInt(sp.get("take") || "30"), 100);

  // Risolve listino: parametro oppure default attivo
  let listId = priceListId;
  if (!listId) {
    const def = await db.priceList.findFirst({
      where: { tenantId: s.tenantId, active: true, isDefault: true },
      select: { id: true },
    });
    if (def) listId = def.id;
    else {
      // fallback: ultimo listino attivo per anno
      const latest = await db.priceList.findFirst({
        where: { tenantId: s.tenantId, active: true },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
        select: { id: true },
      });
      if (latest) listId = latest.id;
    }
  }
  if (!listId) return NextResponse.json({ entries: [], priceListId: null });

  // verifica ownership
  const own = await db.priceList.findFirst({ where: { id: listId, tenantId: s.tenantId }, select: { id: true } });
  if (!own) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let entries;
  if (q) {
    const tsq = buildTsQuery(q);
    const vector = buildTsVectorExpr("PriceListEntry");
    entries = await db.$queryRawUnsafe<any[]>(
      `SELECT id, code, "chapter", category, description, "shortDescription", unit, "unitPrice", "materialCost", "laborCost"
       FROM "PriceListEntry"
       WHERE "priceListId" = $1 AND active = true
       AND (${vector} @@ to_tsquery('italian', $2) OR code ILIKE $3 OR description ILIKE $3)
       ORDER BY code ASC
       LIMIT ${take}`,
      listId, tsq || ":*", `%${q}%`
    );
  } else {
    entries = await db.priceListEntry.findMany({
      where: { priceListId: listId, active: true },
      orderBy: [{ chapter: "asc" }, { code: "asc" }],
      take,
    });
  }
  return NextResponse.json({ entries, priceListId: listId });
}
