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
import { Receipt, Plus, Printer, FileCode2 } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const PAY_VARIANT: any = { UNPAID: "warning", PARTIAL: "warning", PAID: "success", OVERDUE: "destructive", DISPUTED: "destructive" };
const SORTABLE = ["number", "type", "customer", "issueDate", "dueDate", "total", "sdiStatus", "paymentStatus"];
const FILTERABLE = ["number", "type", "sdiStatus", "paymentStatus", "customer"];
const DATE_RANGES = ["issueDate", "dueDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.InvoiceOrderByWithRelationInput {
  switch (sort) {
    case "number": return { number: dir };
    case "type": return { type: dir };
    case "customer": return { customer: { name: dir } };
    case "issueDate": return { issueDate: dir };
    case "dueDate": return { dueDate: dir };
    case "total": return { total: dir };
    case "sdiStatus": return { sdiStatus: dir };
    case "paymentStatus": return { paymentStatus: dir };
    default: return { issueDate: "desc" };
  }
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const customers = await db.customer.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    select: { id: true, name: true, companyName: true },
    orderBy: { name: "asc" },
  });

  const ids = await ftsMatchingIds("Invoice", s.tenantId, p.q, [{ entity: "Customer", fk: "customerId" }]);

  const where: Prisma.InvoiceWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.number ? { number: { contains: p.filters.number, mode: "insensitive" } } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.sdiStatus ? { sdiStatus: p.filters.sdiStatus as any } : {}),
    ...(p.filters.paymentStatus ? { paymentStatus: p.filters.paymentStatus as any } : {}),
    ...(p.filters.customer ? { customerId: p.filters.customer } : {}),
    ...(buildDateRangeWhere(p.dateRanges.issueDate) ? { issueDate: buildDateRangeWhere(p.dateRanges.issueDate) } : {}),
    ...(buildDateRangeWhere(p.dateRanges.dueDate) ? { dueDate: buildDateRangeWhere(p.dateRanges.dueDate) } : {}),
  };

  const [rows, total, totals] = await Promise.all([
    db.invoice.findMany({
      where, include: { customer: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize, take: p.pageSize,
    }),
    db.invoice.count({ where }),
    db.invoice.aggregate({ where, _sum: { total: true, amountPaid: true } }),
  ]);

  const sumTotal = totals._sum.total || 0;
  const sumUnpaid = (totals._sum.total || 0) - (totals._sum.amountPaid || 0);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "number", label: "Numero", sortable: true, filter: { type: "text", placeholder: "Num." }, className: "font-mono", render: inv => inv.number },
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "INVOICE", label: "Fattura" }, { value: "CREDIT_NOTE", label: "Nota credito" },
        { value: "PROFORMA", label: "Proforma" }, { value: "TD24_DEFERRED", label: "TD24 differita" },
        { value: "TD20_SELF", label: "TD20 autofattura" },
      ]},
      render: inv => <Badge variant="outline">{tr(inv.type)}</Badge>,
    },
    {
      key: "customer", label: "Cliente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: customers.map(c => ({ value: c.id, label: c.companyName || c.name })) },
      render: inv => <Link href={`/admin/customers/${inv.customerId}`} className="hover:underline">{inv.customer.companyName || inv.customer.name}</Link>,
    },
    { key: "issueDate", label: "Data", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: inv => formatDate(inv.issueDate) },
    { key: "dueDate", label: "Scadenza", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: inv => inv.dueDate ? formatDate(inv.dueDate) : "—" },
    { key: "total", label: "Totale", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: inv => formatCurrency(inv.total) },
    {
      key: "sdiStatus", label: "SDI", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" }, { value: "QUEUED", label: "In coda" }, { value: "SENT", label: "Inviata" },
        { value: "ACCEPTED", label: "Accettata" }, { value: "REJECTED", label: "Scartata" },
        { value: "DELIVERED", label: "Consegnata" }, { value: "NOT_DELIVERED", label: "Non consegnata" },
      ]},
      render: inv => <Badge variant={inv.sdiStatus === "ACCEPTED" || inv.sdiStatus === "DELIVERED" ? "success" : inv.sdiStatus === "REJECTED" ? "destructive" : "muted"}>{tr(inv.sdiStatus)}</Badge>,
    },
    {
      key: "paymentStatus", label: "Pagamento", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "UNPAID", label: "Non pagata" }, { value: "PARTIAL", label: "Parziale" },
        { value: "PAID", label: "Pagata" }, { value: "OVERDUE", label: "Scaduta" }, { value: "DISPUTED", label: "Contestata" },
      ]},
      render: inv => <Badge variant={PAY_VARIANT[inv.paymentStatus]}>{tr(inv.paymentStatus)}</Badge>,
    },
    {
      key: "actions", label: "",
      render: inv => (
        <div className="flex gap-2">
          <Link href={`/admin/invoices/${inv.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
          <Link href={`/print/invoice/${inv.id}?print=1`} target="_blank" className="text-muted-foreground"><Printer className="h-3.5 w-3.5" /></Link>
          <Link href={`/api/invoices/${inv.id}/xml`} target="_blank" className="text-muted-foreground"><FileCode2 className="h-3.5 w-3.5" /></Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Fatture" description={`${total} documenti · ${formatCurrency(sumTotal)} fatturato · ${formatCurrency(sumUnpaid)} da incassare`}
        actions={<Button asChild><Link href="/admin/invoices/new"><Plus className="h-4 w-4" /> Nuova fattura</Link></Button>} />
      {total === 0 && !p.q && Object.keys(p.filters).length === 0 && Object.keys(p.dateRanges).length === 0 ? (
        <EmptyState icon={<Receipt className="h-7 w-7" />} title="Nessuna fattura" description="Genera fattura elettronica conforme SDI, scarica XML, traccia incassi." cta={<Button asChild><Link href="/admin/invoices/new">Nuova fattura</Link></Button>} />
      ) : (
        <DataTable basePath="/admin/invoices" columns={columns} rows={rows} total={total} rowKey={inv => inv.id} params={p} searchPlaceholder="Cerca per numero, riferimento, cliente…" />
      )}
    </div>
  );
}
