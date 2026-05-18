import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BadgeEuro, Plus, ArrowDown, ArrowUp } from "lucide-react";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["date", "cashbox", "direction", "category", "amount"];
const FILTERABLE = ["direction", "category", "cashbox"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.CashbookEntryOrderByWithRelationInput {
  switch (sort) {
    case "date": return { date: dir };
    case "cashbox": return { cashbox: { name: dir } };
    case "direction": return { direction: dir };
    case "category": return { category: dir };
    case "amount": return { amount: dir };
    default: return { date: "desc" };
  }
}

export default async function CashbookPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const cashboxes = await db.cashbox.findMany({ where: { tenantId: s.tenantId, active: true } });

  const ids = await ftsMatchingIds("CashbookEntry", s.tenantId, p.q);

  const where: Prisma.CashbookEntryWhereInput = {
    tenantId: s.tenantId,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.direction ? { direction: p.filters.direction as any } : {}),
    ...(p.filters.category ? { category: { contains: p.filters.category, mode: "insensitive" } } : {}),
    ...(p.filters.cashbox ? { cashboxId: p.filters.cashbox } : {}),
  };

  const [rows, total, sums] = await Promise.all([
    db.cashbookEntry.findMany({
      where,
      include: { cashbox: true },
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.cashbookEntry.count({ where }),
    Promise.all([
      db.cashbookEntry.aggregate({ where: { ...where, direction: "IN" }, _sum: { amount: true } }),
      db.cashbookEntry.aggregate({ where: { ...where, direction: "OUT" }, _sum: { amount: true } }),
    ]),
  ]);

  const totalIn = sums[0]._sum.amount || 0;
  const totalOut = sums[1]._sum.amount || 0;

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "date", label: "Data", sortable: true, className: "text-xs", render: e => formatDate(e.date) },
    {
      key: "cashbox", label: "Cassa", sortable: true,
      filter: { type: "select", placeholder: "Tutte", options: cashboxes.map(c => ({ value: c.id, label: c.name })) },
      render: e => e.cashbox.name,
    },
    {
      key: "direction", label: "Direzione", sortable: true,
      filter: { type: "select", placeholder: "Tutti", options: [
        { value: "IN", label: "Entrata" },
        { value: "OUT", label: "Uscita" },
      ]},
      render: e => <Badge variant={e.direction === "IN" ? "success" : "warning"}>{e.direction === "IN" ? "Entrata" : "Uscita"}</Badge>,
    },
    {
      key: "description", label: "Descrizione",
      render: e => <div>{e.description}{e.counterpart && <div className="text-xs text-muted-foreground">{e.counterpart}</div>}</div>,
    },
    {
      key: "category", label: "Categoria", sortable: true,
      filter: { type: "text", placeholder: "Categoria" },
      render: e => <Badge variant="muted">{e.category || "—"}</Badge>,
    },
    { key: "documentRef", label: "Riferimento", className: "text-xs", render: e => e.documentRef || "—" },
    {
      key: "amount", label: "Importo", sortable: true,
      className: "text-right font-semibold",
      headerClassName: "text-right",
      render: e => <span className={e.direction === "IN" ? "text-emerald-600" : "text-amber-600"}>{e.direction === "IN" ? "+" : "-"}{formatCurrency(e.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Prima Nota" description="Movimenti cassa e banca" actions={
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/cashbook/cashboxes">Casse / Conti</Link></Button>
          <Button asChild><Link href="/admin/cashbook/new"><Plus className="h-4 w-4" /> Nuovo movimento</Link></Button>
        </div>
      } />

      <div className="grid md:grid-cols-3 gap-4">
        {cashboxes.map(c => (
          <Card key={c.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{c.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="font-display text-2xl font-bold">{formatCurrency(c.currentBalance)}</div>
              <Badge variant="muted" className="mt-1">{tr(c.type)}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-emerald-600"><ArrowDown className="h-4 w-4" /> Entrate</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-bold text-emerald-600">{formatCurrency(totalIn)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-amber-600"><ArrowUp className="h-4 w-4" /> Uscite</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-bold text-amber-600">{formatCurrency(totalOut)}</div></CardContent></Card>
      </div>

      {total === 0 && !p.q && Object.keys(p.filters).length === 0 ? (
        <EmptyState icon={<BadgeEuro className="h-7 w-7" />} title="Nessun movimento" description="Registra entrate e uscite di cassa per avere il polso del cash flow giorno per giorno." cta={<Button asChild><Link href="/admin/cashbook/new">Aggiungi movimento</Link></Button>} />
      ) : (
        <DataTable
          basePath="/admin/cashbook"
          columns={columns}
          rows={rows}
          total={total}
          rowKey={e => e.id}
          params={p}
          searchPlaceholder="Cerca per descrizione, controparte, riferimento…"
        />
      )}
    </div>
  );
}
