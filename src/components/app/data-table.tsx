import Link from "next/link";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildTableUrl, type SortDir } from "@/lib/datatable";
import { DataTableSearch } from "@/components/app/data-table-search";
import { DataTableFilterCell } from "@/components/app/data-table-filter-cell";
import { DataTablePagination } from "@/components/app/data-table-pagination";

export type FilterOption = { value: string; label: string };

export type ColumnFilter =
  | { type: "text"; placeholder?: string }
  | { type: "select"; options: FilterOption[]; placeholder?: string }
  | { type: "daterange" };

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filter?: ColumnFilter;
  className?: string;
  headerClassName?: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  basePath: string;
  columns: ColumnDef<T>[];
  rows: T[];
  total: number;
  rowKey: (row: T) => string;
  rowHref?: (row: T) => string | null;
  params: {
    q: string;
    sort: string;
    dir: SortDir;
    page: number;
    pageSize: number;
    filters: Record<string, string>;
    dateRanges?: Record<string, { from?: string; to?: string }>;
  };
  searchPlaceholder?: string;
  emptyState?: React.ReactNode;
  toolbarRight?: React.ReactNode;
}

function urlState(p: DataTableProps<any>["params"]) {
  const cur: Record<string, string | number> = {};
  if (p.q) cur.q = p.q;
  if (p.sort) cur.sort = p.sort;
  if (p.sort) cur.dir = p.dir;
  if (p.page > 1) cur.page = p.page;
  if (p.pageSize !== 25) cur.pageSize = p.pageSize;
  for (const [k, v] of Object.entries(p.filters)) cur[`f.${k}`] = v;
  if (p.dateRanges) {
    for (const [k, r] of Object.entries(p.dateRanges)) {
      if (r.from) cur[`f.${k}.from`] = r.from;
      if (r.to) cur[`f.${k}.to`] = r.to;
    }
  }
  return cur;
}

export function DataTable<T>({
  basePath,
  columns,
  rows,
  total,
  rowKey,
  rowHref,
  params,
  searchPlaceholder = "Cerca…",
  emptyState,
  toolbarRight,
}: DataTableProps<T>) {
  const current = urlState(params);
  const hasFilterRow = columns.some(c => c.filter);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DataTableSearch basePath={basePath} current={current} initial={params.q} placeholder={searchPlaceholder} />
        {toolbarRight}
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => {
                const isSorted = params.sort === col.key;
                const nextDir: SortDir = isSorted && params.dir === "desc" ? "asc" : "desc";
                const nextUrl = col.sortable
                  ? buildTableUrl(basePath, current, {
                      sort: isSorted && params.dir === "asc" ? null : col.key,
                      dir: isSorted && params.dir === "asc" ? null : nextDir,
                      page: null,
                    })
                  : null;
                return (
                  <TableHead key={col.key} className={col.headerClassName}>
                    {col.sortable && nextUrl ? (
                      <Link href={nextUrl} className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                        <span>{col.label}</span>
                        {isSorted ? (
                          params.dir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </Link>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
            {hasFilterRow && (
              <TableRow className="bg-muted/20">
                {columns.map(col => (
                  <TableHead key={`f-${col.key}`} className="py-1.5">
                    {col.filter ? (
                      <DataTableFilterCell
                        basePath={basePath}
                        current={current}
                        columnKey={col.key}
                        filter={col.filter}
                        initial={params.filters[col.key] || ""}
                        initialDateRange={params.dateRanges?.[col.key]}
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                  {emptyState ?? "Nessun risultato"}
                </TableCell>
              </TableRow>
            ) : (
              rows.map(row => {
                const href = rowHref?.(row);
                return (
                  <TableRow key={rowKey(row)} className={href ? "cursor-pointer hover:bg-muted/40" : undefined}>
                    {columns.map(col => (
                      <TableCell key={col.key} className={col.className}>
                        {href && col.key === columns[0].key ? (
                          <Link href={href} className="block -m-2 p-2">
                            {col.render(row)}
                          </Link>
                        ) : (
                          col.render(row)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination basePath={basePath} current={current} page={params.page} pageSize={params.pageSize} total={total} />
    </div>
  );
}
