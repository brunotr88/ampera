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
import { Building2, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "name", "customer", "startDate", "status"];
const FILTERABLE = ["code", "status"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.ProjectOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "name": return { name: dir };
    case "customer": return { customer: { name: dir } };
    case "startDate": return { startDate: dir };
    case "status": return { status: dir };
    default: return { updatedAt: "desc" };
  }
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("Project", s.tenantId, p.q, [
    { entity: "Customer", fk: "customerId" },
  ]);

  const where: Prisma.ProjectWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
  };

  const [rows, total] = await Promise.all([
    db.project.findMany({
      where,
      include: { customer: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.project.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono", render: r => r.code },
    { key: "name", label: "Nome", sortable: true, render: r => <Link href={`/admin/projects/${r.id}`} className="font-medium hover:underline">{r.name}</Link> },
    {
      key: "customer", label: "Cliente", sortable: true,
      render: r => <Link href={`/admin/customers/${r.customerId}`} className="hover:underline">{r.customer.companyName || r.customer.name}</Link>,
    },
    { key: "startDate", label: "Inizio", sortable: true, className: "text-xs", render: r => r.startDate ? formatDate(r.startDate) : "—" },
    { key: "budget", label: "Budget", className: "text-right", headerClassName: "text-right", render: r => formatCurrency(r.budgetMaterials + r.budgetLabor + r.budgetIndirect) },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" },
        { value: "ACTIVE", label: "Attiva" },
        { value: "ON_HOLD", label: "In pausa" },
        { value: "CLOSED", label: "Chiusa" },
        { value: "CANCELLED", label: "Annullata" },
      ]},
      render: r => <Badge variant={r.status === "ACTIVE" ? "success" : r.status === "CLOSED" ? "muted" : "warning"}>{tr(r.status)}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Commesse" description={`${total} commesse`} actions={<Button asChild><Link href="/admin/projects/new"><Plus className="h-4 w-4" /> Nuova commessa</Link></Button>} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="Nessuna commessa" description="Organizza il lavoro per cantiere, traccia budget vs consuntivo, calcola marginalità." cta={<Button asChild><Link href="/admin/projects/new">Nuova commessa</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/projects"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={r => r.id}
          params={p}
          searchPlaceholder="Cerca per codice, nome, CIG, CUP, cliente…"
        />
      )}
    </div>
  );
}
