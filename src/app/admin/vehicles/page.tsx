import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { formatDate, daysUntil } from "@/lib/utils";
import { tr } from "@/lib/labels";
import { Truck, Plus, ShieldCheck, Wrench, Calendar } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["plate", "model", "type", "assignedTo", "currentKm", "insuranceExpiry", "inspectionExpiry", "maintenanceExpiry"];
const FILTERABLE = ["plate", "type", "assignedTo"];
const DATE_RANGES = ["insuranceExpiry", "inspectionExpiry", "maintenanceExpiry"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.VehicleOrderByWithRelationInput {
  switch (sort) {
    case "plate": return { plate: dir };
    case "model": return { brand: dir };
    case "type": return { type: dir };
    case "assignedTo": return { assignedTo: { name: dir } };
    case "currentKm": return { currentKm: dir };
    case "insuranceExpiry": return { insuranceExpiry: dir };
    case "inspectionExpiry": return { inspectionExpiry: dir };
    case "maintenanceExpiry": return { maintenanceExpiry: dir };
    default: return { plate: "asc" };
  }
}

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const technicians = await db.user.findMany({
    where: { tenantId: s.tenantId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const ids = await ftsMatchingIds("Vehicle", s.tenantId, p.q);

  const where: Prisma.VehicleWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.plate ? { plate: { contains: p.filters.plate, mode: "insensitive" } } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.assignedTo ? { assignedToId: p.filters.assignedTo } : {}),
    ...(buildDateRangeWhere(p.dateRanges.insuranceExpiry) ? { insuranceExpiry: buildDateRangeWhere(p.dateRanges.insuranceExpiry) } : {}),
    ...(buildDateRangeWhere(p.dateRanges.inspectionExpiry) ? { inspectionExpiry: buildDateRangeWhere(p.dateRanges.inspectionExpiry) } : {}),
    ...(buildDateRangeWhere(p.dateRanges.maintenanceExpiry) ? { maintenanceExpiry: buildDateRangeWhere(p.dateRanges.maintenanceExpiry) } : {}),
  };

  // KPI from full set (not paginated)
  const allKpi = await db.vehicle.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    select: { insuranceExpiry: true, inspectionExpiry: true, maintenanceExpiry: true },
  });
  const expiringSoon = (d?: Date | null) => d && daysUntil(d) !== null && daysUntil(d)! < 60;
  const expired = (d?: Date | null) => d && daysUntil(d) !== null && daysUntil(d)! < 0;
  const insExpiring = allKpi.filter(v => expiringSoon(v.insuranceExpiry)).length;
  const insExpired = allKpi.filter(v => expired(v.insuranceExpiry)).length;
  const inspectionExpiring = allKpi.filter(v => expiringSoon(v.inspectionExpiry)).length;
  const maintExpiring = allKpi.filter(v => expiringSoon(v.maintenanceExpiry)).length;

  const [rows, total] = await Promise.all([
    db.vehicle.findMany({
      where,
      include: { assignedTo: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.vehicle.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    {
      key: "plate", label: "Targa", sortable: true, filter: { type: "text", placeholder: "Targa" },
      render: v => <Link href={`/admin/vehicles/${v.id}`} className="font-mono font-semibold hover:underline">{v.plate}</Link>,
    },
    {
      key: "model", label: "Veicolo", sortable: true,
      render: v => <div><div className="text-sm">{v.brand} {v.model}</div>{v.year && <div className="text-xs text-muted-foreground">{v.year}</div>}</div>,
    },
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "VAN", label: "Furgone" },
        { value: "TRUCK", label: "Camion" },
        { value: "CAR", label: "Auto" },
        { value: "ELECTRIC", label: "Elettrico" },
        { value: "MOTORCYCLE", label: "Moto" },
        { value: "TRAILER", label: "Rimorchio" },
      ]},
      render: v => <Badge variant="outline">{tr(v.type)}</Badge>,
    },
    {
      key: "assignedTo", label: "Assegnato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: technicians.map(t => ({ value: t.id, label: t.name })) },
      render: v => v.assignedTo ? <Link href={`/admin/users/${v.assignedToId}`} className="hover:underline">{v.assignedTo.name}</Link> : <span className="text-muted-foreground italic">—</span>,
    },
    { key: "currentKm", label: "Km", sortable: true, className: "text-right font-mono text-sm", headerClassName: "text-right", render: v => v.currentKm.toLocaleString("it-IT") },
    {
      key: "insuranceExpiry", label: "Assicur.", sortable: true, filter: { type: "daterange" }, className: "text-xs",
      render: v => {
        if (!v.insuranceExpiry) return <span className="text-muted-foreground">—</span>;
        const d = daysUntil(v.insuranceExpiry)!;
        return <Badge variant={d < 0 ? "destructive" : d < 60 ? "warning" : "success"}>{formatDate(v.insuranceExpiry)}</Badge>;
      },
    },
    {
      key: "inspectionExpiry", label: "Revisione", sortable: true, filter: { type: "daterange" }, className: "text-xs",
      render: v => {
        if (!v.inspectionExpiry) return <span className="text-muted-foreground">—</span>;
        const d = daysUntil(v.inspectionExpiry)!;
        return <Badge variant={d < 0 ? "destructive" : d < 60 ? "warning" : "success"}>{formatDate(v.inspectionExpiry)}</Badge>;
      },
    },
    {
      key: "maintenanceExpiry", label: "Tagliando", sortable: true, filter: { type: "daterange" }, className: "text-xs",
      render: v => {
        if (!v.maintenanceExpiry) return <span className="text-muted-foreground">—</span>;
        const d = daysUntil(v.maintenanceExpiry)!;
        return <Badge variant={d < 0 ? "destructive" : d < 60 ? "warning" : "muted"}>{formatDate(v.maintenanceExpiry)}</Badge>;
      },
    },
    { key: "actions", label: "", render: v => <Link href={`/admin/vehicles/${v.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Flotta veicoli" description={`${total} mezzi · ${insExpired} assicurazioni scadute · ${insExpiring} in scadenza`}
        actions={<Button asChild><Link href="/admin/vehicles/new"><Plus className="h-4 w-4" /> Nuovo veicolo</Link></Button>} />

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Totali</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{allKpi.length}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className={`text-sm flex items-center gap-2 ${insExpired > 0 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}><ShieldCheck className="h-4 w-4" /> Assicurazione</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{insExpired + insExpiring}</div>
          <div className="text-xs text-muted-foreground">{insExpired} scaduti, {insExpiring} in scadenza</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-400"><Calendar className="h-4 w-4" /> Revisione</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{inspectionExpiring}</div>
          <div className="text-xs text-muted-foreground">in scadenza 60 gg</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400"><Wrench className="h-4 w-4" /> Tagliando</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{maintExpiring}</div>
          <div className="text-xs text-muted-foreground">tagliandi in scadenza</div>
        </CardContent></Card>
      </div>

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Nessun veicolo" description="Aggiungi furgoni, auto aziendali, mezzi: tracciamo km, scadenze assicurazione, revisione, tagliandi." cta={<Button asChild><Link href="/admin/vehicles/new">Nuovo veicolo</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/vehicles"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={v => v.id}
          params={p}
          searchPlaceholder="Cerca per targa, marca, modello, assicurazione…"
        />
      )}
    </div>
  );
}
