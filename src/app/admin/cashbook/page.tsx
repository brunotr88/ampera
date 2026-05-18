import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BadgeEuro, Plus, ArrowDown, ArrowUp } from "lucide-react";

export default async function CashbookPage() {
  const s = await requireSession();
  const [entries, cashboxes] = await Promise.all([
    db.cashbookEntry.findMany({ where: { tenantId: s.tenantId }, include: { cashbox: true }, orderBy: { date: "desc" }, take: 200 }),
    db.cashbox.findMany({ where: { tenantId: s.tenantId, active: true } }),
  ]);

  const totalIn = entries.filter(e => e.direction === "IN").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter(e => e.direction === "OUT").reduce((s, e) => s + e.amount, 0);

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

      {entries.length === 0 ? (
        <EmptyState icon={<BadgeEuro className="h-7 w-7" />} title="Nessun movimento" description="Registra entrate e uscite di cassa per avere il polso del cash flow giorno per giorno." cta={<Button asChild><Link href="/admin/cashbook/new">Aggiungi movimento</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Cassa</TableHead><TableHead>Direzione</TableHead><TableHead>Descrizione</TableHead><TableHead>Categoria</TableHead><TableHead>Riferimento</TableHead><TableHead className="text-right">Importo</TableHead></TableRow></TableHeader>
          <TableBody>
            {entries.map(e => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{formatDate(e.date)}</TableCell>
                <TableCell>{e.cashbox.name}</TableCell>
                <TableCell><Badge variant={e.direction === "IN" ? "success" : "warning"}>{e.direction === "IN" ? "Entrata" : "Uscita"}</Badge></TableCell>
                <TableCell>{e.description}{e.counterpart && <div className="text-xs text-muted-foreground">{e.counterpart}</div>}</TableCell>
                <TableCell><Badge variant="muted">{e.category || "—"}</Badge></TableCell>
                <TableCell className="text-xs">{e.documentRef || "—"}</TableCell>
                <TableCell className={`text-right font-semibold ${e.direction === "IN" ? "text-emerald-600" : "text-amber-600"}`}>{e.direction === "IN" ? "+" : "-"}{formatCurrency(e.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
