import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { HELP } from "@/lib/page-help-data";
import { Users, Plus, Mail, Phone } from "lucide-react";
import { tr } from "@/lib/labels";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["name", "type", "vatNumber", "plants", "projects", "status", "createdAt"];
const FILTERABLE = ["vatNumber", "type", "status"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.CustomerOrderByWithRelationInput {
  switch (sort) {
    case "name": return { name: dir };
    case "type": return { type: dir };
    case "vatNumber": return { vatNumber: dir };
    case "status": return { status: dir };
    case "createdAt": return { createdAt: dir };
    case "plants": return { plants: { _count: dir } };
    case "projects": return { projects: { _count: dir } };
    default: return { createdAt: "desc" };
  }
}

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("Customer", s.tenantId, p.q);

  const where: Prisma.CustomerWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.vatNumber ? {
      OR: [
        { vatNumber: { contains: p.filters.vatNumber, mode: "insensitive" } },
        { fiscalCode: { contains: p.filters.vatNumber, mode: "insensitive" } },
      ],
    } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
  };

  const [rows, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      include: { _count: { select: { plants: true, projects: true, workOrders: true } } },
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.customer.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    {
      key: "name", label: "Cliente", sortable: true,
      render: r => (
        <div>
          <Link href={`/admin/customers/${r.id}`} className="font-medium hover:underline">
            {r.companyName || `${r.name} ${r.surname || ""}`.trim()}
          </Link>
          {r.tags?.length > 0 && <div className="flex gap-1 mt-1">{r.tags.slice(0, 3).map(t => <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>)}</div>}
        </div>
      ),
    },
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "PRIVATE", label: "Privato" },
        { value: "BUSINESS", label: "Azienda" },
        { value: "CONDOMINIUM", label: "Condominio" },
        { value: "PUBLIC_ADMIN", label: "PA" },
      ]},
      render: r => <Badge variant="outline">{tr(r.type)}</Badge>,
    },
    {
      key: "vatNumber", label: "P.IVA / CF", sortable: true,
      filter: { type: "text", placeholder: "P.IVA o CF" },
      render: r => <span className="font-mono text-xs">{r.vatNumber || r.fiscalCode || "—"}</span>,
    },
    {
      key: "contact", label: "Contatti",
      render: r => (
        <div className="text-xs space-y-0.5">
          {r.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{r.email}</div>}
          {r.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{r.phone}</div>}
        </div>
      ),
    },
    { key: "plants", label: "Imp.", sortable: true, className: "text-right", headerClassName: "text-right", render: r => r._count?.plants || 0 },
    { key: "projects", label: "Comm.", sortable: true, className: "text-right", headerClassName: "text-right", render: r => r._count?.projects || 0 },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "ACTIVE", label: "Attivo" },
        { value: "PROSPECT", label: "Prospect" },
        { value: "INACTIVE", label: "Inattivo" },
        { value: "BLOCKED", label: "Bloccato" },
      ]},
      render: r => <Badge variant={r.status === "ACTIVE" ? "success" : r.status === "BLOCKED" ? "destructive" : "muted"}>{tr(r.status)}</Badge>,
    },
    { key: "createdAt", label: "Aggiunto", sortable: true, className: "text-xs text-muted-foreground", render: r => new Date(r.createdAt).toLocaleDateString("it-IT") },
    { key: "actions", label: "", render: r => <Link href={`/admin/customers/${r.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clienti"
        description={`${total} clienti registrati`}
        help={HELP.customers}
        actions={
          <Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Nuovo cliente</Link></Button>
        }
      />

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nessun cliente"
          description="Aggiungi il primo cliente per iniziare a creare preventivi, impianti e interventi."
          cta={<Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Aggiungi cliente</Link></Button>}
        />
      ) : (
        <DataTable
          basePath="/admin/customers"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={r => r.id}
          params={p}
          searchPlaceholder="Cerca cliente, P.IVA, email, telefono…"
        />
      )}
    </div>
  );
}
