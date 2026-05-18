import { notFound } from "next/navigation";
import { tr } from "@/lib/labels";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Printer, Receipt, Send } from "lucide-react";

export default async function QuoteDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const q = await db.quote.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, lines: { orderBy: { position: "asc" } } } });
  if (!q) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Preventivo ${q.number}/v${q.version}`} description={`${q.title} · ${q.customer.companyName || q.customer.name}`} back="/admin/quotes"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/print/quote/${q.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa PDF</Link></Button>
            <Button asChild variant="outline"><Link href={`/api/quotes/${q.id}/send`}><Send className="h-4 w-4" /> Invia</Link></Button>
            {q.status === "ACCEPTED" && <Button asChild><Link href={`/admin/invoices/new?fromQuote=${q.id}`}><Receipt className="h-4 w-4" /> Fattura</Link></Button>}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Righe preventivo</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground uppercase"><th className="text-left pb-2">Descrizione</th><th className="text-right">Q.tà</th><th className="text-right">Prezzo</th><th className="text-right">Sc.%</th><th className="text-right">IVA</th><th className="text-right">Totale</th></tr></thead>
              <tbody>{q.lines.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2">{l.description}<br/>{l.code && <small className="text-muted-foreground font-mono">{l.code}</small>}</td>
                  <td className="text-right">{l.quantity} {l.unit}</td>
                  <td className="text-right">{formatCurrency(l.unitPrice)}</td>
                  <td className="text-right">{l.discountPercent}%</td>
                  <td className="text-right">{l.vatRate}%</td>
                  <td className="text-right font-semibold">{formatCurrency(l.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Totali</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Imponibile</span><span>{formatCurrency(q.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(q.vatTotal)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Totale</span><span className="text-primary">{formatCurrency(q.total)}</span></div>
            <div className="pt-3 flex flex-col gap-2 text-xs">
              <div className="flex justify-between"><span>Stato:</span><Badge variant="info">{tr(q.status)}</Badge></div>
              {q.validUntil && <div>Valido fino: {formatDate(q.validUntil)}</div>}
              {q.sentAt && <div>Inviato: {formatDate(q.sentAt)}</div>}
              {q.acceptedAt && <div>Accettato: {formatDate(q.acceptedAt)}</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      {q.terms && <Card><CardHeader><CardTitle>Condizioni</CardTitle></CardHeader><CardContent><div className="whitespace-pre-wrap text-sm">{q.terms}</div></CardContent></Card>}
    </div>
  );
}
