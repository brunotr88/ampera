import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatDateTime } from "@/lib/utils";
import { FileSignature, Plus } from "lucide-react";
import { parseTableParams, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "title", "category", "status", "createdAt", "signedAt"];
const FILTERABLE = ["code", "category", "status"];
const DATE_RANGES = ["createdAt"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.AmperaDocumentOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "title": return { title: dir };
    case "category": return { category: dir };
    case "status": return { status: dir };
    case "createdAt": return { createdAt: dir };
    case "signedAt": return { signedAt: dir };
    default: return { createdAt: "desc" };
  }
}

const CATEGORY_LABEL: Record<string, string> = {
  SOPRALLUOGO: "Sopralluogo", INCARICO: "Incarico", INIZIO_LAVORI: "Inizio lavori",
  FINE_LAVORI: "Fine lavori", COLLAUDO: "Collaudo", CONSEGNA: "Consegna",
  NON_CONFORMITA: "Non conformità", MANCATO_ACCESSO: "Mancato accesso", RIFIUTO: "Rifiuto",
  SAL: "SAL", GARANZIA: "Garanzia", RELAZIONE_TECNICA: "Relazione tecnica",
  VERIFICA_DPR462: "Verifica DPR 462", FORMAZIONE: "Formazione", ALTRO: "Altro",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bozza", READY: "Pronto", SENT: "Inviato",
  SIGNED: "Firmato", REVOKED: "Revocato", ARCHIVED: "Archiviato",
};

export default async function DocumentiPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const where: Prisma.AmperaDocumentWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(p.q ? {
      OR: [
        { code: { contains: p.q, mode: "insensitive" } },
        { title: { contains: p.q, mode: "insensitive" } },
        { signedByName: { contains: p.q, mode: "insensitive" } },
      ],
    } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.category ? { category: p.filters.category } : {}),
    ...(p.filters.status ? { status: p.filters.status } : {}),
    ...(buildDateRangeWhere(p.dateRanges.createdAt) ? { createdAt: buildDateRangeWhere(p.dateRanges.createdAt) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.amperaDocument.findMany({
      where, orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize, take: p.pageSize,
    }),
    db.amperaDocument.count({ where }),
  ]);

  const customerIds = [...new Set(rows.map(r => r.customerId).filter(Boolean) as string[])];
  const customers = customerIds.length
    ? await db.customer.findMany({ where: { id: { in: customerIds } }, select: { id: true, name: true, companyName: true } })
    : [];
  const cMap = new Map(customers.map(c => [c.id, c.companyName || c.name]));

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: d => d.code },
    { key: "title", label: "Documento", sortable: true, render: d => (
      <div>
        <Link href={`/admin/documenti/${d.id}`} className="font-medium hover:underline">{d.title}</Link>
        {d.customerId && <div className="text-xs text-muted-foreground">{cMap.get(d.customerId) || "—"}</div>}
      </div>
    )},
    {
      key: "category", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l })) },
      render: d => <Badge variant="outline">{CATEGORY_LABEL[d.category] || d.category}</Badge>,
    },
    { key: "createdAt", label: "Creato", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: d => formatDate(d.createdAt) },
    { key: "signedAt", label: "Firmato", sortable: true, className: "text-xs", render: d => d.signedAt ? <div><div>{formatDateTime(d.signedAt)}</div><div className="text-[10px] text-muted-foreground">{d.signedByName}{d.signatureType ? ` · ${d.signatureType}` : ""}</div></div> : "—" },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })) },
      render: d => <Badge variant={d.status === "SIGNED" ? "success" : d.status === "REVOKED" ? "destructive" : d.status === "SENT" ? "info" : "muted"}>{STATUS_LABEL[d.status] || d.status}</Badge>,
    },
    { key: "actions", label: "", render: d => <Link href={`/admin/documenti/${d.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Documentazione" description={`${total} documenti totali`} actions={
        <Button asChild><Link href="/admin/documenti/new"><Plus className="h-4 w-4" /> Genera documento</Link></Button>
      } />
      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<FileSignature className="h-7 w-7" />} title="Nessun documento generato" description="Crea verbali, attestati, dichiarazioni standard a tutela dell'azienda. Firma con tablet, OTP via email o upload PDF firmato." cta={<Button asChild><Link href="/admin/documenti/new">Genera documento</Link></Button>} />
      ) : (
        <DataTable basePath="/admin/documenti" columns={columns} rows={rows} total={total} rowKey={d => d.id} params={p} searchPlaceholder="Cerca per codice, titolo, firmatario…" />
      )}
    </div>
  );
}
