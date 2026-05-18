import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { formatCurrency } from "@/lib/utils";
import { HELP } from "@/lib/page-help-data";
import { INCENTIVES } from "@/lib/incentives";
import { Plus } from "lucide-react";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["code", "type", "totalAmount", "deductibleAmount", "status"];
const FILTERABLE = ["code", "type", "status"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.IncentiveApplicationOrderByWithRelationInput {
  switch (sort) {
    case "code": return { code: dir };
    case "type": return { type: dir };
    case "totalAmount": return { totalAmount: dir };
    case "deductibleAmount": return { deductibleAmount: dir };
    case "status": return { status: dir };
    default: return { createdAt: "desc" };
  }
}

export default async function IncentivesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("IncentiveApplication", s.tenantId, p.q);

  const where: Prisma.IncentiveApplicationWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.code ? { code: { contains: p.filters.code, mode: "insensitive" } } : {}),
    ...(p.filters.type ? { type: p.filters.type as any } : {}),
    ...(p.filters.status ? { status: p.filters.status as any } : {}),
  };

  const [rows, total, totals] = await Promise.all([
    db.incentiveApplication.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.incentiveApplication.count({ where }),
    db.incentiveApplication.aggregate({
      where: { tenantId: s.tenantId },
      _sum: { totalAmount: true, deductibleAmount: true },
      _count: true,
    }),
  ]);

  const totalDeductible = totals._sum.deductibleAmount || 0;
  const totalSpent = totals._sum.totalAmount || 0;
  const openApps = await db.incentiveApplication.count({
    where: { tenantId: s.tenantId, status: { notIn: ["COMPLETED", "CANCELLED"] } },
  });

  const categoriesMap: Record<string, string> = {
    edilizia: "🏠 Edilizia",
    energia: "🔋 Energia",
    sicurezza: "🛡️ Sicurezza",
    accessibilita: "♿ Accessibilità",
    mobilita: "🚗 Mobilità",
    fotovoltaico: "☀️ Fotovoltaico",
  };

  const byCategory = INCENTIVES.reduce<Record<string, typeof INCENTIVES>>((acc, i) => {
    (acc[i.category] = acc[i.category] || []).push(i);
    return acc;
  }, {});

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "code", label: "Codice", sortable: true, filter: { type: "text", placeholder: "Cod." }, className: "font-mono text-xs", render: a => a.code },
    {
      key: "type", label: "Agevolazione", sortable: true,
      filter: { type: "select", placeholder: "Tutte", options: INCENTIVES.map(i => ({ value: i.type, label: i.label })) },
      render: a => {
        const def = INCENTIVES.find(i => i.type === a.type);
        return <Badge variant="info" className="whitespace-nowrap">{def?.label || a.type}</Badge>;
      },
    },
    { key: "description", label: "Descrizione", render: a => <span className="line-clamp-2">{a.workDescription}</span> },
    { key: "totalAmount", label: "Investimento", sortable: true, className: "text-right", headerClassName: "text-right", render: a => formatCurrency(a.totalAmount) },
    { key: "deductibleAmount", label: "Detrazione", sortable: true, className: "text-right font-semibold text-emerald-600", headerClassName: "text-right", render: a => `${formatCurrency(a.deductibleAmount)} (${a.deductiblePercentage}%)` },
    {
      key: "status", label: "Stato", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "DRAFT", label: "Bozza" },
        { value: "ELIGIBLE", label: "Ammissibile" },
        { value: "DOCUMENTS_READY", label: "Documenti pronti" },
        { value: "BANK_TRANSFER_DONE", label: "Bonifico fatto" },
        { value: "ENEA_SUBMITTED", label: "ENEA inviato" },
        { value: "COMPLETED", label: "Completata" },
        { value: "CANCELLED", label: "Annullata" },
      ]},
      render: a => <Badge variant={a.status === "COMPLETED" ? "success" : a.status === "CANCELLED" ? "muted" : "warning"}>{tr(a.status)}</Badge>,
    },
    { key: "actions", label: "", render: a => <Link href={`/admin/incentives/${a.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Agevolazioni Fiscali" description={`${totals._count} pratiche · ${formatCurrency(totalDeductible)} detraibili totali`}
        help={HELP.incentives}
        actions={<Button asChild><Link href="/admin/incentives/new"><Plus className="h-4 w-4" /> Nuova pratica</Link></Button>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pratiche aperte</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{openApps}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Investimento totale</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{formatCurrency(totalSpent)}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Detrazione totale</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold text-emerald-600">{formatCurrency(totalDeductible)}</div>
        </CardContent></Card>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-3">Pratiche in corso</h2>
        <DataTable
          basePath="/admin/incentives"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={a => a.id}
          params={p}
          searchPlaceholder="Cerca per codice, descrizione, riferimento bonifico…"
          emptyState="Nessuna pratica. Crea la prima da una scheda agevolazione qui sotto."
        />
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-1">Agevolazioni disponibili in Italia</h2>
        <p className="text-sm text-muted-foreground mb-4">Tap su una scheda per avviare una pratica con compilazione assistita.</p>

        {Object.entries(byCategory).map(([cat, defs]) => (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{categoriesMap[cat] || cat}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {defs.map(d => (
                <Link key={d.type} href={`/admin/incentives/new?type=${d.type}`} className="block bg-card border border-border rounded-xl p-4 lift hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="default" className="bg-emerald-600">{d.percentage}%</Badge>
                    {d.validUntil && <span className="text-[10px] text-muted-foreground">Scad: {d.validUntil}</span>}
                  </div>
                  <h4 className="font-semibold text-sm">{d.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t text-[11px] text-muted-foreground">
                    {d.maxAmount && <span>Max {formatCurrency(d.maxAmount)}</span>}
                    <span>{d.yearsRecovery}y recupero</span>
                    {d.required.enéa && <span className="text-amber-600">ENEA</span>}
                    {d.required.asseveration && <span className="text-amber-600">Asseverazione</span>}
                    {d.required.cessionAllowed && <span className="text-emerald-600">Cessione OK</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
