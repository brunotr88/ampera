import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { formatCurrency } from "@/lib/utils";
import { BookMarked } from "lucide-react";
import { MaterialDialog } from "./material-dialog";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "metelCode", "name", "brand", "category", "unitPrice"];
const FILTERABLE = ["code", "category", "brand"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.MaterialOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "metelCode": return { metelCode: dir };
    case "name": return { name: dir };
    case "brand": return { brand: dir };
    case "category": return { category: dir };
    case "unitPrice": return { unitPrice: dir };
    default: return { name: "asc" };
  }
}

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("Material", s.tenantId, p.q);

  const where: Prisma.MaterialWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.category ? { category: { contains: p.filters.category, mode: "insensitive" } } : {}),
    ...(p.filters.brand ? { brand: { contains: p.filters.brand, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    db.material.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.material.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: r => r.code },
    { key: "metelCode", label: "METEL", sortable: true, className: "font-mono text-xs", render: r => r.metelCode || "—" },
    { key: "name", label: "Nome", sortable: true, className: "font-medium", render: r => r.name },
    { key: "brand", label: "Marca", sortable: true, filter: { type: "text", placeholder: "Marca" }, render: r => r.brand || "—" },
    { key: "category", label: "Categoria", sortable: true, filter: { type: "text", placeholder: "Categoria" }, className: "text-xs", render: r => r.category || "—" },
    { key: "unitPrice", label: "Prezzo", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: r => formatCurrency(r.unitPrice) },
    { key: "vatRate", label: "IVA", className: "text-right text-xs", headerClassName: "text-right", render: r => `${r.vatRate}%` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Articoli" description={`${total} articoli a catalogo`} actions={<MaterialDialog />} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><BookMarked className="h-10 w-10 mx-auto mb-2" />Nessun articolo</div>
      ) : (
        <DataTable
          basePath="/admin/materials"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={r => r.id}
          params={p}
          searchPlaceholder="Cerca per codice, METEL, descrizione, marca, barcode…"
        />
      )}
    </div>
  );
}
