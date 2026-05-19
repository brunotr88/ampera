import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ImportCard } from "./import-card";
import { SeedDemoButton } from "./seed-button";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import { Pencil, Star } from "lucide-react";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "chapter", "category", "description", "unit", "unitPrice"];
const FILTERABLE = ["code", "chapter", "category", "unit"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.PriceListEntryOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "chapter": return { chapter: dir };
    case "category": return { category: dir };
    case "description": return { description: dir };
    case "unit": return { unit: dir };
    case "unitPrice": return { unitPrice: dir };
    default: return { code: "asc" };
  }
}

export default async function PriceListDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const s = await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const list = await db.priceList.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!list) return notFound();

  // chapter options
  const chapters = await db.priceListEntry.findMany({
    where: { priceListId: id, chapter: { not: null } },
    select: { chapter: true },
    distinct: ["chapter"],
    orderBy: { chapter: "asc" },
  });
  const units = await db.priceListEntry.findMany({
    where: { priceListId: id },
    select: { unit: true },
    distinct: ["unit"],
    orderBy: { unit: "asc" },
  });

  const ids = await ftsMatchingIds("PriceListEntry", s.tenantId, p.q);

  const where: Prisma.PriceListEntryWhereInput = {
    priceListId: id,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.chapter ? { chapter: p.filters.chapter } : {}),
    ...(p.filters.category ? { category: { contains: p.filters.category, mode: "insensitive" } } : {}),
    ...(p.filters.unit ? { unit: p.filters.unit } : {}),
  };

  const [rows, total] = await Promise.all([
    db.priceListEntry.findMany({
      where, orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize, take: p.pageSize,
    }),
    db.priceListEntry.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: r => r.code },
    {
      key: "chapter", label: "Capitolo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: chapters.filter(c => c.chapter).map(c => ({ value: c.chapter!, label: c.chapter! })) },
      render: r => r.chapter || "—",
    },
    {
      key: "category", label: "Categoria", sortable: true, filter: { type: "text", placeholder: "Categoria" },
      render: r => (
        <div className="text-xs">
          {r.category && <div className="font-medium">{r.category}</div>}
          {r.subCategory && <div className="text-muted-foreground">{r.subCategory}</div>}
        </div>
      ),
    },
    {
      key: "description", label: "Descrizione", sortable: true,
      render: r => (
        <div className="max-w-md">
          <div className="line-clamp-2 text-sm">{r.shortDescription || r.description}</div>
          {r.notes && <div className="text-xs text-muted-foreground italic mt-0.5">{r.notes}</div>}
        </div>
      ),
    },
    {
      key: "unit", label: "UM", sortable: true,
      filter: { type: "select", placeholder: "Tutte", options: units.map(u => ({ value: u.unit, label: u.unit })) },
      className: "text-xs", render: r => r.unit,
    },
    {
      key: "unitPrice", label: "Prezzo", sortable: true,
      className: "text-right font-semibold", headerClassName: "text-right",
      render: r => (
        <div>
          <div>{formatCurrency(r.unitPrice)}</div>
          {(r.materialCost != null || r.laborCost != null) && (
            <div className="text-[10px] text-muted-foreground font-normal">
              {r.materialCost != null && `Mat: ${r.materialCost.toFixed(2)}`}
              {r.laborCost != null && ` · Mdo: ${r.laborCost.toFixed(2)}`}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={list.name}
        description={`${list.source} · Anno ${list.year} · ${list.totalEntries} voci`}
        back="/admin/prezzario"
        actions={
          <div className="flex gap-2 items-center">
            {list.isDefault && <Badge variant="default"><Star className="h-3 w-3" /> Default</Badge>}
            {!list.active && <Badge variant="muted">Disattivato</Badge>}
            <SeedDemoButton priceListId={list.id} />
          </div>
        }
      />

      {list.description && (
        <Card><CardContent className="p-4 text-sm text-muted-foreground">{list.description}</CardContent></Card>
      )}

      <DataTable
        basePath={`/admin/prezzario/${list.id}`}
        columns={columns}
        rows={rows}
        total={total}
        rowKey={r => r.id}
        params={p}
        searchPlaceholder="Cerca per codice, descrizione, categoria…"
        emptyState={
          <div>
            <p className="mb-2">Nessuna voce nel listino.</p>
            <p className="text-xs">Importa un CSV qui sotto oppure aggiungi voci manualmente via API.</p>
          </div>
        }
      />

      <ImportCard priceListId={list.id} />
    </div>
  );
}
