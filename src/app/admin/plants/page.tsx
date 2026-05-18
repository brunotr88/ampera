import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, daysUntil } from "@/lib/utils";
import { Zap, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["name", "customer", "type", "ratedPowerKw", "installDate", "nextCheckDate"];
const FILTERABLE = ["name", "type"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.PlantOrderByWithRelationInput {
  switch (sort) {
    case "name": return { name: dir };
    case "customer": return { customer: { name: dir } };
    case "type": return { type: dir };
    case "ratedPowerKw": return { ratedPowerKw: dir };
    case "installDate": return { installDate: dir };
    case "nextCheckDate": return { nextCheckDate: dir };
    default: return { updatedAt: "desc" };
  }
}

export default async function PlantsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("Plant", s.tenantId, p.q, [
    { entity: "Customer", fk: "customerId" },
  ]);

  const where: Prisma.PlantWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.name ? { name: { contains: p.filters.name, mode: "insensitive" } } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
  };

  const [rows, total] = await Promise.all([
    db.plant.findMany({
      where,
      include: { customer: true, site: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.plant.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    {
      key: "name", label: "Impianto", sortable: true, filter: { type: "text", placeholder: "Nome" },
      render: r => (
        <div>
          <Link href={`/admin/plants/${r.id}`} className="font-medium hover:underline">{r.name}</Link>
          {r.code && <div className="text-xs text-muted-foreground font-mono">{r.code}</div>}
        </div>
      ),
    },
    {
      key: "customer", label: "Cliente", sortable: true,
      render: r => <Link href={`/admin/customers/${r.customerId}`} className="hover:underline">{r.customer.companyName || `${r.customer.name} ${r.customer.surname || ""}`.trim()}</Link>,
    },
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "CIVIL", label: "Civile" },
        { value: "INDUSTRIAL", label: "Industriale" },
        { value: "PHOTOVOLTAIC", label: "Fotovoltaico" },
        { value: "DOMOTIC", label: "Domotica" },
        { value: "EMERGENCY", label: "Emergenza" },
        { value: "TLC", label: "TLC" },
        { value: "FIRE_ALARM", label: "Antincendio" },
        { value: "HVAC", label: "HVAC" },
        { value: "CHARGING_STATION", label: "Ricarica EV" },
      ]},
      render: r => <Badge variant="outline">{tr(r.type)}</Badge>,
    },
    { key: "ratedPowerKw", label: "Potenza", sortable: true, className: "text-right", headerClassName: "text-right", render: r => r.ratedPowerKw ? `${r.ratedPowerKw} kW` : "—" },
    { key: "installDate", label: "Installato", sortable: true, className: "text-xs", render: r => r.installDate ? formatDate(r.installDate) : "—" },
    {
      key: "nextCheckDate", label: "Verifica", sortable: true,
      render: r => {
        if (!r.nextCheckDate) return "—";
        const d = daysUntil(r.nextCheckDate);
        return <Badge variant={d !== null && d < 30 ? "warning" : "muted"}>{formatDate(r.nextCheckDate)}</Badge>;
      },
    },
    { key: "actions", label: "", render: r => <Link href={`/admin/plants/${r.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Impianti" description={`${total} impianti gestiti`} actions={
        <Button asChild><Link href="/admin/plants/new"><Plus className="h-4 w-4" /> Nuovo impianto</Link></Button>
      } />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<Zap className="h-7 w-7" />} title="Nessun impianto" description="Gli impianti sono entità di prima classe: avrai storico interventi, DICO e scadenze DPR 462 per ognuno." cta={<Button asChild><Link href="/admin/plants/new"><Plus className="h-4 w-4" /> Aggiungi impianto</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/plants"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={r => r.id}
          params={p}
          searchPlaceholder="Cerca per nome impianto, codice, cliente, tipo…"
        />
      )}
    </div>
  );
}
