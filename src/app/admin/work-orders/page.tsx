import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Wrench, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const STATUS_VARIANT: any = { SCHEDULED: "info", IN_PROGRESS: "warning", PAUSED: "warning", COMPLETED: "success", CANCELLED: "muted", EMERGENCY: "destructive" };
const SORTABLE = ["code", "title", "customer", "scheduledDate", "technician", "priority", "status"];
const FILTERABLE = ["code", "status", "priority", "technician", "customer"];
const DATE_RANGES = ["scheduledDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.WorkOrderOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "title": return { title: dir };
    case "customer": return { customer: { name: dir } };
    case "scheduledDate": return { scheduledDate: dir };
    case "technician": return { assignedTo: { name: dir } };
    case "priority": return { priority: dir };
    case "status": return { status: dir };
    default: return { scheduledDate: "desc" };
  }
}

export default async function WorkOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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

  const ids = await ftsMatchingIds("WorkOrder", s.tenantId, p.q, [
    { entity: "Customer", fk: "customerId" },
    { entity: "Plant", fk: "plantId" },
  ]);

  const scheduledRange = buildDateRangeWhere(p.dateRanges.scheduledDate);

  const where: Prisma.WorkOrderWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(p.filters.priority ? { priority: p.filters.priority as any } : {}),
    ...(p.filters.technician ? { assignedToId: p.filters.technician } : {}),
    ...(p.filters.customer ? { customerId: p.filters.customer } : {}),
    ...(scheduledRange ? { scheduledDate: scheduledRange } : {}),
  };

  const [rows, total] = await Promise.all([
    db.workOrder.findMany({
      where,
      include: { customer: true, plant: true, assignedTo: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.workOrder.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: w => w.code },
    { key: "title", label: "Titolo", sortable: true, render: w => <div className="font-medium">{w.title}</div> },
    {
      key: "customer", label: "Cliente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: customers.map(c => ({ value: c.id, label: c.companyName || c.name })) },
      render: w => (
        <Link href={`/admin/customers/${w.customerId}`} className="hover:underline">
          {w.customer.companyName || `${w.customer.name} ${w.customer.surname || ""}`.trim()}
        </Link>
      ),
    },
    { key: "scheduledDate", label: "Programmato", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: w => w.scheduledDate ? formatDateTime(w.scheduledDate) : "—" },
    {
      key: "technician", label: "Tecnico", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: technicians.map(t => ({ value: t.id, label: t.name })) },
      render: w => w.assignedTo ? <Link href={`/admin/users/${w.assignedToId}`} className="hover:underline">{w.assignedTo.name}</Link> : <span className="text-muted-foreground italic">Non assegnato</span>,
    },
    {
      key: "priority", label: "Priorità", sortable: true,
      filter: { type: "select", placeholder: "Tutte", options: [
        { value: "LOW", label: "Bassa" },
        { value: "NORMAL", label: "Normale" },
        { value: "URGENT", label: "Urgente" },
        { value: "EMERGENCY", label: "Emergenza" },
      ]},
      render: w => <Badge variant={w.priority === "EMERGENCY" ? "destructive" : w.priority === "URGENT" ? "warning" : "muted"}>{tr(w.priority)}</Badge>,
    },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "SCHEDULED", label: "Programmato" },
        { value: "IN_PROGRESS", label: "In corso" },
        { value: "PAUSED", label: "Pausa" },
        { value: "COMPLETED", label: "Completato" },
        { value: "CANCELLED", label: "Annullato" },
        { value: "EMERGENCY", label: "Emergenza" },
      ]},
      render: w => <Badge variant={STATUS_VARIANT[w.status]}>{tr(w.status)}</Badge>,
    },
    { key: "actions", label: "", render: w => <Link href={`/admin/work-orders/${w.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Interventi" description={`${total} interventi`} actions={
        <Button asChild><Link href="/admin/work-orders/new"><Plus className="h-4 w-4" /> Nuovo intervento</Link></Button>
      } />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 && Object.keys(p.dateRanges).length === 0 ? (
        <EmptyState icon={<Wrench className="h-7 w-7" />} title="Nessun intervento" description="Pianifica il primo intervento per assegnarlo a un tecnico." cta={<Button asChild><Link href="/admin/work-orders/new"><Plus className="h-4 w-4" /> Nuovo intervento</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/work-orders"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={w => w.id}
          params={p}
          searchPlaceholder="Cerca per codice, titolo, descrizione, cliente, impianto…"
        />
      )}
    </div>
  );
}
