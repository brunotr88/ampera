/**
 * Helpers per DataTable SSR.
 * Parsing URL params, costruzione WHERE/ORDER BY/skip/take, esecuzione FTS.
 */
import { db } from "@/lib/db";
import { buildTsQuery, buildTsVectorExpr, type EntityName } from "@/lib/search-fields";
import { Prisma } from "@prisma/client";

export type SortDir = "asc" | "desc";

export interface DataTableParams {
  q?: string;
  sort?: string;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
  filters?: Record<string, string>;
  dateRanges?: Record<string, { from?: string; to?: string }>;
}

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;

/** Parsa Next.js searchParams (string | string[] | undefined) in DataTableParams. */
export function parseTableParams(
  searchParams: Record<string, string | string[] | undefined>,
  sortableKeys: string[],
  filterableKeys: string[],
  dateRangeKeys: string[] = [],
): {
  q: string;
  sort: string;
  dir: SortDir;
  page: number;
  pageSize: number;
  filters: Record<string, string>;
  dateRanges: Record<string, { from?: string; to?: string }>;
} {
  const get = (k: string): string | undefined => {
    const v = searchParams[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = (get("q") || "").trim();
  const sortRaw = get("sort") || "";
  const dirRaw = get("dir") === "asc" ? "asc" : "desc";
  const sort = sortableKeys.includes(sortRaw) ? sortRaw : "";
  const dir: SortDir = sort ? (dirRaw as SortDir) : "desc";

  const pageRaw = parseInt(get("page") || "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const psRaw = parseInt(get("pageSize") || String(DEFAULT_PAGE_SIZE), 10);
  const pageSize = Number.isFinite(psRaw) && psRaw > 0 ? Math.min(psRaw, MAX_PAGE_SIZE) : DEFAULT_PAGE_SIZE;

  const filters: Record<string, string> = {};
  for (const key of filterableKeys) {
    const fk = `f.${key}`;
    const v = get(fk);
    if (v && v.trim()) filters[key] = v.trim();
  }

  const dateRanges: Record<string, { from?: string; to?: string }> = {};
  for (const key of dateRangeKeys) {
    const from = get(`f.${key}.from`)?.trim();
    const to = get(`f.${key}.to`)?.trim();
    if (from || to) dateRanges[key] = { from: from || undefined, to: to || undefined };
  }

  return { q, sort, dir, page, pageSize, filters, dateRanges };
}

/** Converte stringa ISO (YYYY-MM-DD) in Date (start of day local). */
export function parseDateFrom(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

/** Converte stringa ISO (YYYY-MM-DD) in Date (end of day, 23:59:59.999). */
export function parseDateTo(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  if (isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Helper per costruire WHERE Prisma date range. */
export function buildDateRangeWhere(range: { from?: string; to?: string } | undefined): { gte?: Date; lte?: Date } | undefined {
  if (!range) return undefined;
  const gte = parseDateFrom(range.from);
  const lte = parseDateTo(range.to);
  if (!gte && !lte) return undefined;
  return { ...(gte && { gte }), ...(lte && { lte }) };
}

/**
 * Esegue FTS su entità Prisma e ritorna gli ID matching (limitati per safety).
 * Usato come sub-filtro: poi Prisma fa la findMany con id: { in: ... }.
 *
 * Se passate `joins`, estende la ricerca anche su entità collegate (customer, plant, etc).
 * Es: `ftsMatchingIds("Report", tenantId, q, [{ entity: "Customer", fk: "customerId" }])`
 *  produce: r.id IN (... WHERE r.fts @@ OR c.fts @@)
 */
export async function ftsMatchingIds(
  entity: EntityName,
  tenantId: string,
  q: string,
  joins: Array<{ entity: EntityName; fk: string }> = [],
  limit = 5000,
): Promise<string[] | null> {
  const tsq = buildTsQuery(q);
  if (!tsq) return null;

  const mainVector = buildTsVectorExpr(entity, "main");
  const joinClauses: string[] = [];
  const orClauses: string[] = [`${mainVector} @@ to_tsquery('italian', $2)`];

  joins.forEach((j, i) => {
    const alias = `j${i}`;
    joinClauses.push(`LEFT JOIN "${j.entity}" ${alias} ON ${alias}.id = main."${j.fk}"`);
    orClauses.push(`${buildTsVectorExpr(j.entity, alias)} @@ to_tsquery('italian', $2)`);
  });

  const sql = `
    SELECT main.id FROM "${entity}" main
    ${joinClauses.join("\n")}
    WHERE main."tenantId" = $1
    AND (${orClauses.join(" OR ")})
    LIMIT ${Math.min(limit, 10000)}
  `;
  const rows = await db.$queryRawUnsafe<{ id: string }[]>(sql, tenantId, tsq);
  return rows.map(r => r.id);
}

/** Costruisce ORDER BY whitelisted (key → Prisma orderBy fragment). */
export function buildOrderBy<T extends Record<string, any>>(
  sort: string,
  dir: SortDir,
  sortMap: Record<string, (d: SortDir) => T>,
  defaultOrder: T,
): T {
  if (sort && sortMap[sort]) return sortMap[sort](dir);
  return defaultOrder;
}

/** Costruisce link URL preservando altri params. */
export function buildTableUrl(
  basePath: string,
  current: Record<string, string | number | undefined>,
  override: Record<string, string | number | null>,
): string {
  const params = new URLSearchParams();
  const merged: Record<string, string | number | undefined> = { ...current };
  for (const [k, v] of Object.entries(override)) {
    if (v === null || v === "") merged[k] = undefined;
    else merged[k] = v;
  }
  for (const [k, v] of Object.entries(merged)) {
    if (v !== undefined && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export { Prisma };
