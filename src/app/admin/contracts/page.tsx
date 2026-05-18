import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { Truck, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["name", "customer", "plant", "nextDueDate", "feeMonthly", "active"];
const FILTERABLE = ["active", "customer"];
const DATE_RANGES = ["nextDueDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.MaintenanceContractOrderByWithRelationInput {
  switch (sort) {
    case "name": return { name: dir };
    case "customer": return { customer: { name: dir } };
    case "plant": return { plant: { name: dir } };
    case "nextDueDate": return { nextDueDate: dir };
    case "feeMonthly": return { feeMonthly: dir };
    case "active": return { active: dir };
    default: return { nextDueDate: "asc" };
  }
}

export default async function ContractsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const customers = await db.customer.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    select: { id: true, name: true, companyName: true },
    orderBy: { name: "asc" },
  });

  const ids = await ftsMatchingIds("MaintenanceContract", s.tenantId, p.q, [
    { entity: "Customer", fk: "customerId" },
    { entity: "Plant", fk: "plantId" },
  ]);

  const where: Prisma.MaintenanceContractWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.active === "1" ? { active: true } : p.filters.active === "0" ? { active: false } : {}),
    ...(p.filters.customer ? { customerId: p.filters.customer } : {}),
    ...(buildDateRangeWhere(p.dateRanges.nextDueDate) ? { nextDueDate: buildDateRangeWhere(p.dateRanges.nextDueDate) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.maintenanceContract.findMany({
      where, include: { customer: true, plant: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize, take: p.pageSize,
    }),
    db.maintenanceContract.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "name", label: "Contratto", sortable: true, className: "font-medium", render: c => c.name },
    {
      key: "customer", label: "Cliente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: customers.map(c => ({ value: c.id, label: c.companyName || c.name })) },
      render: c => <Link href={`/admin/customers/${c.customerId}`} className="hover:underline">{c.customer.companyName || c.customer.name}</Link>,
    },
    {
      key: "plant", label: "Impianto", sortable: true,
      render: c => c.plant ? <Link href={`/admin/plants/${c.plantId}`} className="hover:underline">{c.plant.name}</Link> : "—",
    },
    {
      key: "nextDueDate", label: "Prossima scadenza", sortable: true, filter: { type: "daterange" },
      render: c => {
        const d = daysUntil(c.nextDueDate);
        return <Badge variant={d !== null && d <= 30 ? "warning" : "muted"}>{formatDate(c.nextDueDate)}</Badge>;
      },
    },
    { key: "feeMonthly", label: "Canone mese", sortable: true, className: "text-right", headerClassName: "text-right", render: c => formatCurrency(c.feeMonthly) },
    {
      key: "active", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "1", label: "Attivo" }, { value: "0", label: "Sospeso" },
      ]},
      render: c => <Badge variant={c.active ? "success" : "muted"}>{c.active ? "Attivo" : "Sospeso"}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Contratti manutenzione" description={`${total} contratti ricorrenti`} actions={<Button asChild><Link href="/admin/contracts/new"><Plus className="h-4 w-4" /> Nuovo</Link></Button>} />
      {total === 0 && !p.q && Object.keys(p.filters).length === 0 && Object.keys(p.dateRanges).length === 0 ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Nessun contratto" description="Genera ricavi ricorrenti: contratti di manutenzione con scadenze automatiche e fatturazione." />
      ) : (
        <DataTable basePath="/admin/contracts" columns={columns} rows={rows} total={total} rowKey={c => c.id} params={p} searchPlaceholder="Cerca per nome contratto, cliente, impianto…" />
      )}
    </div>
  );
}
