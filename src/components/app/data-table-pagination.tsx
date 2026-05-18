import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildTableUrl } from "@/lib/datatable";

interface Props {
  basePath: string;
  current: Record<string, string | number>;
  page: number;
  pageSize: number;
  total: number;
}

export function DataTablePagination({ basePath, current, page, pageSize, total }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  const prevUrl = prevDisabled ? null : buildTableUrl(basePath, current, { page: page <= 2 ? null : page - 1 });
  const nextUrl = nextDisabled ? null : buildTableUrl(basePath, current, { page: page + 1 });

  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div>
        {from}–{to} di {total}
      </div>
      <div className="flex items-center gap-1">
        {prevUrl ? (
          <Link href={prevUrl} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 hover:bg-muted" scroll={false}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Indietro
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 opacity-50">
            <ChevronLeft className="h-3.5 w-3.5" />
            Indietro
          </span>
        )}
        <span className="px-2">
          Pag. {page} / {totalPages}
        </span>
        {nextUrl ? (
          <Link href={nextUrl} className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 hover:bg-muted" scroll={false}>
            Avanti
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 opacity-50">
            Avanti
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
