import { tr } from "@/lib/labels";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { HELP } from "@/lib/page-help-data";
import { Shield, FileText, Printer, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { PRIVACY_TEMPLATES } from "@/lib/privacy-templates";
import { PrivacyDialog } from "./privacy-dialog";
import { parseTableParams, ftsMatchingIds, buildDateRangeWhere, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["type", "subjectName", "subjectEmail", "audience", "createdAt"];
const FILTERABLE = ["type", "audience"];
const DATE_RANGES = ["createdAt"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.PrivacyDocumentOrderByWithRelationInput {
  switch (sort) {
    case "type": return { type: dir };
    case "subjectName": return { subjectName: dir };
    case "subjectEmail": return { subjectEmail: dir };
    case "audience": return { audience: dir };
    case "createdAt": return { createdAt: dir };
    default: return { createdAt: "desc" };
  }
}

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE, DATE_RANGES);

  const ids = await ftsMatchingIds("PrivacyDocument", s.tenantId, p.q);

  const where: Prisma.PrivacyDocumentWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.audience ? { audience: p.filters.audience } : {}),
    ...(buildDateRangeWhere(p.dateRanges.createdAt) ? { createdAt: buildDateRangeWhere(p.dateRanges.createdAt) } : {}),
  };

  const [rows, total] = await Promise.all([
    db.privacyDocument.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.privacyDocument.count({ where }),
  ]);

  const templates = PRIVACY_TEMPLATES.map(t => ({ type: t.type, title: t.title, audience: t.audience, description: t.description, consentRequired: t.consentRequired }));

  const columns: ColumnDef<typeof rows[number]>[] = [
    {
      key: "type", label: "Tipo", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: PRIVACY_TEMPLATES.map(t => ({ value: t.type, label: t.title })) },
      render: d => <Badge variant="outline">{tr(d.type)}</Badge>,
    },
    { key: "subjectName", label: "Interessato", sortable: true, className: "font-medium", render: d => d.subjectName || "—" },
    { key: "subjectEmail", label: "Email", sortable: true, className: "text-xs", render: d => d.subjectEmail || "—" },
    {
      key: "audience", label: "Pubblico", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "CUSTOMER", label: "Cliente" },
        { value: "EMPLOYEE", label: "Operatore" },
        { value: "BOTH", label: "Entrambi" },
      ]},
      render: d => <Badge variant="muted">{tr(d.audience)}</Badge>,
    },
    { key: "createdAt", label: "Generato", sortable: true, filter: { type: "daterange" }, className: "text-xs", render: d => formatDate(d.createdAt) },
    {
      key: "status", label: "Stato",
      render: d => <Badge variant={d.signedAt ? "success" : d.revokedAt ? "destructive" : "warning"}>{d.signedAt ? "Firmato" : d.revokedAt ? "Revocato" : "Non firmato"}</Badge>,
    },
    {
      key: "actions", label: "",
      render: d => (
        <div className="flex gap-2">
          <Link href={`/print/privacy/${d.id}?print=1`} target="_blank" className="text-muted-foreground hover:text-foreground"><Printer className="h-3.5 w-3.5" /></Link>
          <Link href={`/admin/privacy/${d.id}`} className="text-primary text-xs font-semibold">Apri</Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Privacy & GDPR" description="Informative conformi GDPR e consensi tracciati per clienti e operatori" help={HELP.privacy}
        actions={<PrivacyDialog templates={templates} />}
      />

      <div>
        <h2 className="font-display text-xl font-bold mb-3">Modelli disponibili</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(t => (
            <Link key={t.type} href={`/admin/privacy/new?type=${t.type}`} className="text-left bg-card border border-border rounded-xl p-4 lift hover:border-primary/40 transition-colors block">
              <div className="flex items-start justify-between mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <Badge variant="muted" className="text-[10px]">{tr(t.audience)}</Badge>
              </div>
              <h3 className="font-semibold text-sm">{t.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.description}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t text-[10px] text-muted-foreground">
                {t.consentRequired ? <span className="text-amber-600 dark:text-amber-400">Consenso richiesto</span> : <span>Solo informativa</span>}
                <ChevronRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-3">Documenti generati ({total})</h2>
        {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2" />Nessun documento ancora generato.</CardContent></Card>
        ) : (
          <DataTable
            basePath="/admin/privacy"
            columns={columns}
            rows={rows}
            total={total}
            rowKey={d => d.id}
            params={p}
            searchPlaceholder="Cerca per nome, email, CF, firmatario…"
          />
        )}
      </div>
    </div>
  );
}
