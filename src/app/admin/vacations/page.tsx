import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Sun } from "lucide-react";
import { NewVacationDialog, VacationRowActions } from "./vacation-actions";
import { parseTableParams, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const TYPE_LABEL: Record<string, string> = { VACATION: "Ferie", PERMIT: "Permesso", ILLNESS: "Malattia", TRAINING: "Formazione", LEAVE_104: "L. 104", PARENTAL: "Genitoriale", OTHER: "Altro" };
const SORTABLE = ["user", "type", "startDate", "endDate", "status"];
const FILTERABLE = ["user", "type", "status"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.VacationRequestOrderByWithRelationInput {
  switch (sort) {
    case "user": return { user: { name: dir } };
    case "type": return { type: dir };
    case "startDate": return { startDate: dir };
    case "endDate": return { endDate: dir };
    case "status": return { status: dir };
    default: return { startDate: "desc" };
  }
}

export default async function VacationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const users = await db.user.findMany({
    where: { tenantId: s.tenantId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const where: Prisma.VacationRequestWhereInput = {
    tenantId: s.tenantId,
    ...(p.q ? {
      OR: [
        { reason: { contains: p.q, mode: "insensitive" } },
        { rejectedReason: { contains: p.q, mode: "insensitive" } },
        { user: { name: { contains: p.q, mode: "insensitive" } } },
      ],
    } : {}),
    ...(p.filters.user ? { userId: p.filters.user } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
  };

  const [rows, total] = await Promise.all([
    db.vacationRequest.findMany({
      where,
      include: { user: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.vacationRequest.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    {
      key: "user", label: "Utente", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: users.map(u => ({ value: u.id, label: u.name })) },
      render: v => v.user.name,
    },
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: Object.entries(TYPE_LABEL).map(([k, v]) => ({ value: k, label: v })) },
      render: v => <Badge variant="outline">{TYPE_LABEL[v.type]}</Badge>,
    },
    { key: "period", label: "Periodo", render: v => `${formatDate(v.startDate)} → ${formatDate(v.endDate)}` },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "PENDING", label: "In attesa" },
        { value: "APPROVED", label: "Approvata" },
        { value: "REJECTED", label: "Rifiutata" },
      ]},
      render: v => <Badge variant={v.status === "APPROVED" ? "success" : v.status === "PENDING" ? "warning" : "destructive"}>{tr(v.status)}</Badge>,
    },
    { key: "reason", label: "Motivo", className: "text-xs text-muted-foreground", render: v => v.reason || v.rejectedReason || "—" },
    {
      key: "actions", label: "", className: "text-right",
      render: v => v.status === "PENDING" ? <VacationRowActions id={v.id} /> : null,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Ferie & Permessi" description={`${total} richieste registrate`} actions={<NewVacationDialog users={users} />} />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><Sun className="h-7 w-7 mx-auto mb-2" />Nessuna richiesta</div>
      ) : (
        <DataTable
          basePath="/admin/vacations"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={v => v.id}
          params={p}
          searchPlaceholder="Cerca per utente, motivo…"
        />
      )}
    </div>
  );
}
