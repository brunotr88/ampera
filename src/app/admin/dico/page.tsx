import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { FileCheck, Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["number", "plant", "rtName", "issueDate", "status"];
const FILTERABLE = ["number", "status"];
const DATE_RANGES = ["issueDate"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.ConformityDeclarationOrderByWithRelationInput {
  switch (sort) {
    case "number": return { number: dir };
    case "plant": return { plant: { name: dir } };
    case "rtName": return { rtName: dir };
    case "issueDate": return { issueDate: dir };
    case "status": return { status: dir };
    default: return { createdAt: "desc" };
  }
}

export default async function DicoPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const ids = await ftsMatchingIds("ConformityDeclaration", s.tenantId, p.q, [
    { entity: "Plant", fk: "plantId" },
  ]);

  const where: Prisma.ConformityDeclarationWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.number ? { number: { contains: p.filters.number, mode: "insensitive" } } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
    ...(buildDateRangeWhere(p.dateRanges.issueDate) ? { issueDate: buildDateRangeWhere(p.dateRanges.issueDate) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.conformityDeclaration.findMany({
      where,
      include: { plant: { include: { customer: true } } },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.conformityDeclaration.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "number", label: "Numero", sortable: true, filter: { type: "text", placeholder: "Num." }, className: "font-mono", render: d => d.number },
    {
      key: "customer", label: "Cliente",
      render: d => <Link href={`/admin/customers/${d.plant.customerId}`} className="hover:underline">{d.plant.customer.companyName || d.plant.customer.name}</Link>,
    },
    {
      key: "plant", label: "Impianto", sortable: true,
      render: d => <Link href={`/admin/plants/${d.plantId}`} className="hover:underline">{d.plant.name}</Link>,
    },
    { key: "rtName", label: "RT", sortable: true, className: "text-xs", render: d => d.rtName || "—" },
    { key: "issueDate", label: "Data emissione", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: d => d.issueDate ? formatDate(d.issueDate) : "—" },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" },
        { value: "COMPLETE", label: "Completa" },
        { value: "ISSUED", label: "Emessa" },
        { value: "SENT_TO_INAIL", label: "Inviata INAIL" },
        { value: "ARCHIVED", label: "Archiviata" },
      ]},
      render: d => <Badge variant={d.status === "ISSUED" ? "success" : d.status === "SENT_TO_INAIL" ? "info" : "muted"}>{tr(d.status)}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="DICO - Dichiarazioni di Conformità" description={`${total} DICO archiviate (DM 37/08)`} actions={<Button asChild><Link href="/admin/dico/new"><Plus className="h-4 w-4" /> Nuova DICO</Link></Button>} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<FileCheck className="h-7 w-7" />} title="Nessuna DICO" description="Genera DICO conforme DM 37/08 con tutti gli allegati pre-spuntati per evitare DICO incomplete." />
      ) : (
        <DataTable
          basePath="/admin/dico"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={d => d.id}
          params={p}
          searchPlaceholder="Cerca per numero, RT, impianto, cliente…"
        />
      )}
    </div>
  );
}
