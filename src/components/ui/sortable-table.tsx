"use client";
import { useState, useMemo, ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  accessor?: (row: T) => any;
  sortable?: boolean;
  filterable?: boolean;
  className?: string;
  align?: "left" | "right" | "center";
};

export function SortableTable<T extends { id?: any }>({
  data, columns, defaultSortKey, defaultSortDir = "desc", searchable = true, searchPlaceholder = "Cerca…", emptyMessage = "Nessun risultato", rowHref, pageSize = 50,
}: {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  rowHref?: (row: T) => string;
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  function toggleSort(col: Column<T>) {
    if (!col.sortable) return;
    if (sortKey !== col.key) { setSortKey(col.key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir("asc"); }
  }

  const filteredAndSorted = useMemo(() => {
    let rows = [...data];
    if (q && searchable) {
      const lower = q.toLowerCase();
      rows = rows.filter(row => columns.some(c => {
        const v = c.accessor ? c.accessor(row) : (row as any)[c.key];
        return String(v ?? "").toLowerCase().includes(lower);
      }));
    }
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      if (col) {
        rows.sort((a, b) => {
          const va = col.accessor ? col.accessor(a) : (a as any)[col.key];
          const vb = col.accessor ? col.accessor(b) : (b as any)[col.key];
          const na = va instanceof Date ? va.getTime() : va;
          const nb = vb instanceof Date ? vb.getTime() : vb;
          if (na == null && nb == null) return 0;
          if (na == null) return 1;
          if (nb == null) return -1;
          if (typeof na === "number" && typeof nb === "number") return sortDir === "asc" ? na - nb : nb - na;
          return sortDir === "asc" ? String(na).localeCompare(String(nb), "it") : String(nb).localeCompare(String(na), "it");
        });
      }
    }
    return rows;
  }, [data, q, sortKey, sortDir, columns, searchable]);

  const pages = Math.ceil(filteredAndSorted.length / pageSize);
  const paginated = filteredAndSorted.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder={searchPlaceholder} value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        </div>
      )}
      <div className="relative w-full overflow-auto rounded-lg border bg-card">
        <table className="w-full caption-bottom text-sm">
          <thead className="bg-muted/40 [&_tr]:border-b">
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col)}
                  className={cn(
                    "h-11 px-3 text-left align-middle font-semibold text-muted-foreground text-xs uppercase tracking-wide",
                    col.sortable && "cursor-pointer hover:text-foreground select-none",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className,
                  )}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && (sortKey === col.key
                      ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
                      : <ChevronsUpDown className="h-3 w-3 opacity-30" />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={columns.length} className="p-8 text-center text-muted-foreground">{emptyMessage}</td></tr>
            ) : paginated.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={cn("border-b transition-colors hover:bg-muted/50", rowHref && "cursor-pointer")}
                onClick={() => rowHref && (window.location.href = rowHref(row))}
              >
                {columns.map(col => (
                  <td key={col.key} className={cn("p-3 align-middle", col.align === "right" && "text-right", col.align === "center" && "text-center", col.className)}>
                    {col.cell ? col.cell(row) : (col.accessor ? col.accessor(row) : (row as any)[col.key]) ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredAndSorted.length} risultati · pagina {page + 1} di {pages}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 rounded border disabled:opacity-30">«</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-1 rounded border disabled:opacity-30">‹</button>
            <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page >= pages - 1} className="px-2 py-1 rounded border disabled:opacity-30">›</button>
            <button onClick={() => setPage(pages - 1)} disabled={page >= pages - 1} className="px-2 py-1 rounded border disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
