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
import { FileText, Plus, Printer } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const STATUS_VARIANT: any = { DRAFT: "muted", SENT: "info", VIEWED: "info", ACCEPTED: "success", REJECTED: "destructive", EXPIRED: "muted", CONVERTED: "success" };
const SORTABLE = ["number", "title", "customer", "createdAt", "validUntil", "total", "status"];
const FILTERABLE = ["number", "status", "customer"];
const DATE_RANGES = ["createdAt", "validUntil"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.QuoteOrderByWithRelationInput {
  switch (sort) {
    case "number": return { number: dir };
    case "title": return { title: dir };
    case "customer": return { customer: { name: dir } };
    case "validUntil": return { validUntil: dir };
    case "total": return { total: dir };
    case "status": return { status: dir };
    case "createdAt": return { createdAt: dir };
    default: return { createdAt: "desc" };
  }
}

export default async function QuotesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const customers = await db.customer.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    select: { id: true, name: true, companyName: true },
    orderBy: { name: "asc" },
  });

  const ids = await ftsMatchingIds("Quote", s.tenantId, p.q, [{ entity: "Customer", fk: "customerId" }]);

  const where: Prisma.QuoteWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.number ? { number: { contains: p.filters.number, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(p.filters.customer ? { customerId: p.filters.customer } : {}),
    ...(buildDateRangeWhere(p.dateRanges.createdAt) ? { createdAt: buildDateRangeWhere(p.dateRanges.createdAt) } : {}),
    ...(buildDateRangeWhere(p.dateRanges.validUntil) ? { validUntil: buildDateRangeWhere(p.dateRanges.validUntil) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.quote.findMany({
      where, include: { customer: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize, take: p.pageSize,
    }),
    db.quote.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "number", label: "Numero", sortable: true, filter: { type: "text", placeholder: "Num." }, className: "font-mono", render: q => `${q.number}/v${q.version}` },
    { key: "title", label: "Titolo", sortable: true, render: q => q.title },
    {
      key: "customer", label: "Cliente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: customers.map(c => ({ value: c.id, label: c.companyName || c.name })) },
      render: q => <Link href={`/admin/customers/${q.customerId}`} className="hover:underline">{q.customer.companyName || q.customer.name}</Link>,
    },
    { key: "createdAt", label: "Data", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: q => formatDate(q.createdAt) },
    { key: "validUntil", label: "Validità", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: q => q.validUntil ? formatDate(q.validUntil) : "—" },
    { key: "total", label: "Totale", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: q => formatCurrency(q.total) },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" }, { value: "SENT", label: "Inviato" }, { value: "VIEWED", label: "Visto" },
        { value: "ACCEPTED", label: "Accettato" }, { value: "REJECTED", label: "Rifiutato" },
        { value: "EXPIRED", label: "Scaduto" }, { value: "CONVERTED", label: "Convertito" },
      ]},
      render: q => <Badge variant={STATUS_VARIANT[q.status]}>{tr(q.status)}</Badge>,
    },
    {
      key: "actions", label: "",
      render: q => (
        <div className="flex gap-2">
          <Link href={`/admin/quotes/${q.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
          <Link href={`/print/quote/${q.id}?print=1`} target="_blank" className="text-muted-foreground"><Printer className="h-3.5 w-3.5" /></Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Preventivi" description={`${total} preventivi nel pipeline`} actions={<Button asChild><Link href="/admin/quotes/new"><Plus className="h-4 w-4" /> Nuovo preventivo</Link></Button>} />
      {total === 0 && !p.q && Object.keys(p.filters).length === 0 && Object.keys(p.dateRanges).length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} title="Nessun preventivo" description="Crea preventivi professionali, invia al cliente per firma digitale, converti in fattura." cta={<Button asChild><Link href="/admin/quotes/new">Nuovo preventivo</Link></Button>} />
      ) : (
        <DataTable basePath="/admin/quotes" columns={columns} rows={rows} total={total} rowKey={q => q.id} params={p} searchPlaceholder="Cerca numero, titolo, descrizione, cliente…" />
      )}
    </div>
  );
}
