import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingCart, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const STATUS_VARIANT: any = { DRAFT: "muted", SENT: "info", CONFIRMED: "info", PARTIAL: "warning", RECEIVED: "success", CANCELLED: "destructive" };
const SORTABLE = ["number", "supplier", "issueDate", "expectedDate", "total", "status"];
const FILTERABLE = ["number", "status"];
const DATE_RANGES = ["issueDate", "expectedDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.PurchaseOrderOrderByWithRelationInput {
  switch (sort) {
    case "number": return { number: dir };
    case "supplier": return { supplier: { name: dir } };
    case "issueDate": return { issueDate: dir };
    case "expectedDate": return { expectedDate: dir };
    case "total": return { total: dir };
    case "status": return { status: dir };
    default: return { issueDate: "desc" };
  }
}

export default async function PurchaseOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const ids = await ftsMatchingIds("PurchaseOrder", s.tenantId, p.q, [
    { entity: "Supplier", fk: "supplierId" },
  ]);

  const where: Prisma.PurchaseOrderWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.number ? { number: { contains: p.filters.number, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(buildDateRangeWhere(p.dateRanges.issueDate) ? { issueDate: buildDateRangeWhere(p.dateRanges.issueDate) } : {}),
    ...(buildDateRangeWhere(p.dateRanges.expectedDate) ? { expectedDate: buildDateRangeWhere(p.dateRanges.expectedDate) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      include: { supplier: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.purchaseOrder.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "number", label: "Numero", sortable: true, filter: { type: "text", placeholder: "Num." }, className: "font-mono", render: o => o.number },
    { key: "supplier", label: "Fornitore", sortable: true, render: o => o.supplier.name },
    { key: "issueDate", label: "Emissione", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: o => formatDate(o.issueDate) },
    { key: "expectedDate", label: "Attesa", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: o => o.expectedDate ? formatDate(o.expectedDate) : "—" },
    { key: "total", label: "Totale", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: o => formatCurrency(o.total) },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" },
        { value: "SENT", label: "Inviato" },
        { value: "CONFIRMED", label: "Confermato" },
        { value: "PARTIAL", label: "Parziale" },
        { value: "RECEIVED", label: "Ricevuto" },
        { value: "CANCELLED", label: "Annullato" },
      ]},
      render: o => <Badge variant={STATUS_VARIANT[o.status]}>{tr(o.status)}</Badge>,
    },
    { key: "actions", label: "", render: o => <Link href={`/admin/purchase-orders/${o.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Ordini Fornitori" description={`${total} ordini`} actions={
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/suppliers">Fornitori</Link></Button>
          <Button asChild><Link href="/admin/purchase-orders/new"><Plus className="h-4 w-4" /> Nuovo ordine</Link></Button>
        </div>
      } />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="Nessun ordine" description="Crea ordini ai fornitori e carica direttamente il magazzino al ricevimento merce." cta={<Button asChild><Link href="/admin/purchase-orders/new">Nuovo ordine</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/purchase-orders"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={o => o.id}
          params={p}
          searchPlaceholder="Cerca per numero, fornitore…"
        />
      )}
    </div>
  );
}
