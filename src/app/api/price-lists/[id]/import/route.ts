import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Importa voci da CSV. Le colonne attese (in ordine indifferente):
 *  code, chapter, category, subCategory, description, shortDescription,
 *  unit, unitPrice, materialCost, laborCost, laborHours, laborRate, notes
 * Separatore: virgola o punto-e-virgola (auto-detect).
 * Decimale: punto o virgola (auto-detect).
 * Comportamento: UPSERT su (priceListId, code).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const list = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const csv: string = body.csv || "";
  const sourceFile: string = body.sourceFile || "uploaded.csv";

  if (!csv.trim()) return NextResponse.json({ error: "csv vuoto" }, { status: 400 });

  const lines = csv.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return NextResponse.json({ error: "almeno header + 1 riga richiesto" }, { status: 400 });

  // Auto-detect separator
  const headerLine = lines[0];
  const semi = (headerLine.match(/;/g) || []).length;
  const comma = (headerLine.match(/,/g) || []).length;
  const sep = semi > comma ? ";" : ",";

  const headers = parseCsvLine(headerLine, sep).map(h => h.trim().toLowerCase());
  const idx = (name: string) => headers.findIndex(h => h === name.toLowerCase());

  const ICODE = idx("code");
  const IDESC = idx("description");
  if (ICODE === -1 || IDESC === -1) {
    return NextResponse.json({ error: "Colonne obbligatorie 'code' e 'description' non trovate" }, { status: 400 });
  }
  const ICHAP = idx("chapter");
  const ICAT = idx("category");
  const ISUB = idx("subCategory");
  const ISHORT = idx("shortDescription");
  const IUNIT = idx("unit");
  const IPRICE = idx("unitPrice");
  const IMAT = idx("materialCost");
  const ILAB = idx("laborCost");
  const ILH = idx("laborHours");
  const ILR = idx("laborRate");
  const INOTES = idx("notes");

  function n(s: string | undefined): number | null {
    if (!s) return null;
    const cleaned = s.replace(/\./g, "").replace(",", ".").trim();
    const v = parseFloat(cleaned);
    return isNaN(v) ? null : v;
  }

  let created = 0, updated = 0, skipped = 0;
  const errors: string[] = [];

  for (let li = 1; li < lines.length; li++) {
    const row = parseCsvLine(lines[li], sep);
    const code = row[ICODE]?.trim();
    const desc = row[IDESC]?.trim();
    if (!code || !desc) { skipped++; continue; }

    try {
      const data = {
        chapter: ICHAP > -1 ? (row[ICHAP]?.trim() || null) : null,
        category: ICAT > -1 ? (row[ICAT]?.trim() || null) : null,
        subCategory: ISUB > -1 ? (row[ISUB]?.trim() || null) : null,
        description: desc,
        shortDescription: ISHORT > -1 ? (row[ISHORT]?.trim() || null) : null,
        unit: IUNIT > -1 ? (row[IUNIT]?.trim() || "pz") : "pz",
        unitPrice: IPRICE > -1 ? (n(row[IPRICE]) ?? 0) : 0,
        materialCost: IMAT > -1 ? n(row[IMAT]) : null,
        laborCost: ILAB > -1 ? n(row[ILAB]) : null,
        laborHours: ILH > -1 ? n(row[ILH]) : null,
        laborRate: ILR > -1 ? n(row[ILR]) : null,
        notes: INOTES > -1 ? (row[INOTES]?.trim() || null) : null,
      };

      const existing = await db.priceListEntry.findUnique({
        where: { priceListId_code: { priceListId: id, code } },
      });
      if (existing) {
        await db.priceListEntry.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await db.priceListEntry.create({
          data: { ...data, code, priceListId: id, tenantId: s.tenantId },
        });
        created++;
      }
    } catch (e: any) {
      errors.push(`Riga ${li + 1}: ${e.message}`);
      if (errors.length > 20) { errors.push("... troncato"); break; }
    }
  }

  const total = await db.priceListEntry.count({ where: { priceListId: id } });
  await db.priceList.update({
    where: { id },
    data: { totalEntries: total, importedAt: new Date(), importSourceFile: sourceFile },
  });

  return NextResponse.json({ created, updated, skipped, errors, total });
}

/** Parser CSV semplice con supporto " " quoting. */
function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === sep) { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
