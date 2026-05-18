import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ClipboardList, Printer } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "customer", "plant", "technician", "date", "hours", "amount", "status"];
const FILTERABLE = ["code", "status", "technician", "customer"];
const DATE_RANGES = ["date"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.ReportOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "customer": return { customer: { name: dir } };
    case "plant": return { plant: { name: dir } };
    case "technician": return { technician: { name: dir } };
    case "date": return { signedAt: dir };
    case "hours": return { totalHours: dir };
    case "amount": return { totalAmount: dir };
    case "status": return { status: dir };
    default: return { updatedAt: "desc" };
  }
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const [technicians, customers] = await Promise.all([
    db.user.findMany({
      where: { tenantId: s.tenantId, role: { in: ["TECHNICIAN", "ADMIN", "OWNER", "OFFICE"] }, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.customer.findMany({
      where: { tenantId: s.tenantId, deletedAt: null },
      select: { id: true, name: true, companyName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const ids = await ftsMatchingIds("Report", s.tenantId, p.q, [
    { entity: "Customer", fk: "customerId" },
    { entity: "Plant", fk: "plantId" },
  ]);

  const dateRange = buildDateRangeWhere(p.dateRanges.date);

  const where: Prisma.ReportWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(p.filters.technician ? { technicianId: p.filters.technician } : {}),
    ...(p.filters.customer ? { customerId: p.filters.customer } : {}),
    ...(dateRange ? { OR: [{ signedAt: dateRange }, { endedAt: dateRange }, { createdAt: dateRange }] } : {}),
  };

  const [rows, total] = await Promise.all([
    db.report.findMany({
      where,
      include: { customer: true, plant: true, technician: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.report.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: r => r.code },
    {
      key: "customer", label: "Cliente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: customers.map(c => ({ value: c.id, label: c.companyName || c.name })) },
      render: r => (
        <Link href={`/admin/customers/${r.customerId}`} className="hover:underline">
          {r.customer.companyName || r.customer.name}
        </Link>
      ),
    },
    {
      key: "plant", label: "Impianto", sortable: true,
      render: r => r.plant ? <Link href={`/admin/plants/${r.plantId}`} className="hover:underline">{r.plant.name}</Link> : "—",
    },
    {
      key: "technician", label: "Tecnico", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: technicians.map(t => ({ value: t.id, label: t.name })) },
      render: r => <Link href={`/admin/users/${r.technicianId}`} className="hover:underline">{r.technician.name}</Link>,
    },
    {
      key: "date", label: "Data", sortable: true, filter: { type: "daterange" }, className: "text-xs",
      render: r => formatDateTime(r.signedAt || r.endedAt || r.createdAt),
    },
    { key: "hours", label: "Ore", sortable: true, className: "text-right", headerClassName: "text-right", render: r => r.totalHours?.toFixed(1) ?? "—" },
    { key: "amount", label: "Totale", sortable: true, className: "text-right font-semibold", headerClassName: "text-right", render: r => formatCurrency(r.totalAmount) },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" },
        { value: "SUBMITTED", label: "Inviato" },
        { value: "INVOICED", label: "Fatturato" },
        { value: "ARCHIVED", label: "Archiviato" },
      ]},
      render: r => (
        <Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "INVOICED" ? "info" : "muted"}>
          {tr(r.status)}
        </Badge>
      ),
    },
    {
      key: "actions", label: "",
      render: r => (
        <div className="flex gap-2">
          <Link href={`/admin/reports/${r.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
          <Link href={`/print/report/${r.id}?print=1`} target="_blank" className="text-muted-foreground hover:text-foreground"><Printer className="h-3.5 w-3.5" /></Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Rapportini" description={`${total} rapportini totali`} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 && Object.keys(p.dateRanges).length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="Nessun rapportino" description="I tecnici creeranno i rapportini dall'app mobile (/operatore)." />
      ) : (
        <DataTable
          basePath="/admin/reports"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={r => r.id}
          params={p}
          searchPlaceholder="Cerca per codice, descrizione, causa…"
        />
      )}
    </div>
  );
}
