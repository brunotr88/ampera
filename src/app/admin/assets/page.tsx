import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { tr } from "@/lib/labels";
import { Building2, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "name", "category", "acquisitionDate", "purchasePrice", "amortizationYears", "status"];
const FILTERABLE = ["code", "category", "status"];
const DATE_RANGES = ["acquisitionDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.AssetAcquisitionOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "name": return { name: dir };
    case "category": return { category: dir };
    case "acquisitionDate": return { acquisitionDate: dir };
    case "purchasePrice": return { purchasePrice: dir };
    case "amortizationYears": return { amortizationYears: dir };
    case "status": return { status: dir };
    default: return { acquisitionDate: "desc" };
  }
}

export default async function AssetsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const ids = await ftsMatchingIds("AssetAcquisition", s.tenantId, p.q);

  const where: Prisma.AssetAcquisitionWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.category ? { category: { contains: p.filters.category, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(buildDateRangeWhere(p.dateRanges.acquisitionDate) ? { acquisitionDate: buildDateRangeWhere(p.dateRanges.acquisitionDate) } : {}),
  };

  const [rows, total, kpi] = await Promise.all([
    db.assetAcquisition.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.assetAcquisition.count({ where }),
    db.assetAcquisition.aggregate({ where: { tenantId: s.tenantId, status: "ACTIVE" }, _sum: { purchasePrice: true }, _count: true }),
  ]);

  const totalValue = kpi._sum.purchasePrice || 0;
  const totalCount = kpi._count;

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: a => a.code },
    {
      key: "name", label: "Nome", sortable: true,
      render: a => <div><div className="font-medium">{a.name}</div>{a.serialNumber && <div className="text-xs text-muted-foreground">S/N {a.serialNumber}</div>}</div>,
    },
    { key: "category", label: "Categoria", sortable: true, filter: { type: "text", placeholder: "Categoria" }, render: a => a.category || "—" },
    { key: "acquisitionDate", label: "Data acq.", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: a => formatDate(a.acquisitionDate) },
    { key: "purchasePrice", label: "Prezzo", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: a => formatCurrency(a.purchasePrice) },
    { key: "amortizationYears", label: "Ammort.", sortable: true, className: "text-xs", render: a => `${a.amortizationYears}y` },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "ACTIVE", label: "Attivo" },
        { value: "DISPOSED", label: "Dismesso" },
        { value: "SOLD", label: "Venduto" },
        { value: "WRITTEN_OFF", label: "Stralciato" },
        { value: "IN_REPAIR", label: "In riparazione" },
      ]},
      render: a => <Badge variant={a.status === "ACTIVE" ? "success" : a.status === "DISPOSED" || a.status === "WRITTEN_OFF" ? "destructive" : "muted"}>{tr(a.status)}</Badge>,
    },
    { key: "actions", label: "", render: a => <Link href={`/admin/assets/${a.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Cespiti aziendali" description={`${totalCount} cespiti attivi · ${formatCurrency(totalValue)} valore di acquisto`}
        actions={<Button asChild><Link href="/admin/assets/new"><Plus className="h-4 w-4" /> Nuovo cespite</Link></Button>} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="Nessun cespite" description="Registra macchinari, attrezzature, hardware acquistati come beni strumentali." cta={<Button asChild><Link href="/admin/assets/new">Nuovo cespite</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/assets"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={a => a.id}
          params={p}
          searchPlaceholder="Cerca per codice, nome, S/N, categoria…"
        />
      )}
    </div>
  );
}
