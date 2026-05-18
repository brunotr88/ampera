import { notFound } from "next/navigation";
import { tr } from "@/lib/labels";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HELP } from "@/lib/page-help-data";
import { Printer, FileCode2, Banknote } from "lucide-react";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const inv = await db.invoice.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, lines: { orderBy: { position: "asc" } } } });
  if (!inv) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Fattura ${inv.number}`} description={`${inv.customer.companyName || inv.customer.name} · ${formatDate(inv.issueDate)}`} back="/admin/invoices" help={HELP.invoices}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/print/invoice/${inv.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa</Link></Button>
            <Button asChild variant="outline"><Link href={`/api/invoices/${inv.id}/xml`} target="_blank"><FileCode2 className="h-4 w-4" /> XML SDI</Link></Button>
            <Button asChild><Link href={`/admin/cashbook/new?invoiceId=${inv.id}`}><Banknote className="h-4 w-4" /> Registra incasso</Link></Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Righe</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs text-muted-foreground uppercase"><th className="text-left pb-2">Descrizione</th><th className="text-right">Q.tà</th><th className="text-right">Prezzo</th><th className="text-right">IVA</th><th className="text-right">Totale</th></tr></thead>
              <tbody>{inv.lines.map(l => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2">{l.description}</td>
                  <td className="text-right">{l.quantity} {l.unit}</td>
                  <td className="text-right">{formatCurrency(l.unitPrice)}</td>
                  <td className="text-right">{l.vatRate}%</td>
                  <td className="text-right font-semibold">{formatCurrency(l.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Totali e stato</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Imponibile</span><span>{formatCurrency(inv.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(inv.vatTotal)}</span></div>
            {inv.stampDuty > 0 && <div className="flex justify-between"><span>Bollo</span><span>{formatCurrency(inv.stampDuty)}</span></div>}
            {inv.withholdingTax > 0 && <div className="flex justify-between"><span>Ritenuta</span><span>-{formatCurrency(inv.withholdingTax)}</span></div>}
            <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Totale</span><span className="text-primary">{formatCurrency(inv.total)}</span></div>
            <div className="flex justify-between pt-2"><span>Incassato</span><span className="font-semibold text-emerald-600">{formatCurrency(inv.amountPaid)}</span></div>
            <div className="flex justify-between"><span>Residuo</span><span className={`font-semibold ${inv.total - inv.amountPaid > 0 ? "text-amber-600" : ""}`}>{formatCurrency(inv.total - inv.amountPaid)}</span></div>
            <div className="pt-3 flex flex-col gap-1 text-xs">
              <div className="flex justify-between"><span>SDI:</span><Badge variant="muted">{tr(inv.sdiStatus)}</Badge></div>
              <div className="flex justify-between"><span>Pagamento:</span><Badge variant="warning">{tr(inv.paymentStatus)}</Badge></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {inv.notes && <Card><CardHeader><CardTitle>Note</CardTitle></CardHeader><CardContent><div className="whitespace-pre-wrap text-sm">{inv.notes}</div></CardContent></Card>}

      <Attachments entityType="Invoice" entityId={inv.id} title="Allegati fattura (ordine, DDT, conferme)" accept=".pdf,image/*,.xml" />
    </div>
  );
}
