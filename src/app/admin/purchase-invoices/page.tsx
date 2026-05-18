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
import { Receipt, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["number", "issueDate", "dueDate", "total", "paymentStatus"];
const FILTERABLE = ["number", "paymentStatus"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.PurchaseInvoiceOrderByWithRelationInput {
  switch (sort) {
    case "number": return { number: dir };
    case "issueDate": return { issueDate: dir };
    case "dueDate": return { dueDate: dir };
    case "total": return { total: dir };
    case "paymentStatus": return { paymentStatus: dir };
    default: return { issueDate: "desc" };
  }
}

export default async function PurchaseInvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("PurchaseInvoice", s.tenantId, p.q, [
    { entity: "Supplier", fk: "supplierId" },
  ]);

  const where: Prisma.PurchaseInvoiceWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.number ? { number: { contains: p.filters.number, mode: "insensitive" } } : {}),
    ...(p.filters.paymentStatus ? { paymentStatus: p.filters.paymentStatus as any } : {}),
  };

  const [rows, total, totals, unpaid] = await Promise.all([
    db.purchaseInvoice.findMany({
      where,
      include: { lines: { select: { id: true } } },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.purchaseInvoice.count({ where }),
    db.purchaseInvoice.aggregate({ where: { tenantId: s.tenantId }, _sum: { total: true } }),
    db.purchaseInvoice.aggregate({ where: { tenantId: s.tenantId, paymentStatus: { not: "PAID" } }, _sum: { total: true, amountPaid: true } }),
  ]);

  const supplierIds = [...new Set(rows.map(r => r.supplierId))];
  const suppliers = supplierIds.length
    ? await db.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } })
    : [];
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));

  const totalSum = totals._sum.total || 0;
  const unpaidSum = (unpaid._sum.total || 0) - (unpaid._sum.amountPaid || 0);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "number", label: "Numero", sortable: true, filter: { type: "text", placeholder: "Num." }, className: "font-mono", render: i => `${i.number}${i.series ? `/${i.series}` : ""}` },
    { key: "supplier", label: "Fornitore", render: i => supplierMap.get(i.supplierId) || "—" },
    { key: "issueDate", label: "Data", sortable: true, className: "text-xs", render: i => formatDate(i.issueDate) },
    { key: "dueDate", label: "Scadenza", sortable: true, className: "text-xs", render: i => i.dueDate ? formatDate(i.dueDate) : "—" },
    { key: "subtotal", label: "Imp.", className: "text-right", headerClassName: "text-right", render: i => formatCurrency(i.subtotal) },
    { key: "vatTotal", label: "IVA", className: "text-right", headerClassName: "text-right", render: i => formatCurrency(i.vatTotal) },
    { key: "total", label: "Totale", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: i => formatCurrency(i.total) },
    {
      key: "paymentStatus", label: "Pagamento", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "UNPAID", label: "Non pagata" },
        { value: "PARTIAL", label: "Parziale" },
        { value: "PAID", label: "Pagata" },
        { value: "OVERDUE", label: "Scaduta" },
        { value: "DISPUTED", label: "Contestata" },
      ]},
      render: i => <Badge variant={i.paymentStatus === "PAID" ? "success" : i.paymentStatus === "OVERDUE" ? "destructive" : "warning"}>{tr(i.paymentStatus)}</Badge>,
    },
    { key: "lineCount", label: "Righe", className: "text-xs", render: i => i.lines.length },
    { key: "actions", label: "", render: i => <Link href={`/admin/purchase-invoices/${i.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fatture acquisto" description={`${total} fatture · ${formatCurrency(totalSum)} tot · ${formatCurrency(unpaidSum)} da pagare`}
        actions={<Button asChild><Link href="/admin/purchase-invoices/new"><Plus className="h-4 w-4" /> Registra fattura</Link></Button>} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<Receipt className="h-7 w-7" />} title="Nessuna fattura acquisto" description="Registra fatture passive da fornitori: ogni riga può andare a magazzino (carico stock) o cespite (ammortamento)" cta={<Button asChild><Link href="/admin/purchase-invoices/new">Registra fattura</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/purchase-invoices"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={i => i.id}
          params={p}
          searchPlaceholder="Cerca per numero, fornitore, note…"
        />
      )}
    </div>
  );
}
