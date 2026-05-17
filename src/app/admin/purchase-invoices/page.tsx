"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { t } from "@/lib/labels";
import { Receipt, Plus, Loader2 } from "lucide-react";

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/purchase-invoices").then(r => r.json()).then(d => { setInvoices(d.invoices || []); setLoading(false); });
  }, []);

  const totalSum = invoices.reduce((s, i) => s + (i.total || 0), 0);
  const unpaidSum = invoices.filter(i => i.paymentStatus !== "PAID").reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Fatture acquisto" description={`${invoices.length} fatture · ${formatCurrency(totalSum)} tot · ${formatCurrency(unpaidSum)} da pagare`}
        actions={<Button asChild><Link href="/admin/purchase-invoices/new"><Plus className="h-4 w-4" /> Registra fattura</Link></Button>} />

      {loading ? <Card><CardContent className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /> Caricamento...</CardContent></Card> :
       invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="h-7 w-7" />} title="Nessuna fattura acquisto" description="Registra fatture passive da fornitori: ogni riga può andare a magazzino (carico stock) o cespite (ammortamento)" cta={<Button asChild><Link href="/admin/purchase-invoices/new">Registra fattura</Link></Button>} />
      ) : (
        <Card><CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 border-b text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Numero</th><th>Fornitore</th><th>Data</th><th>Scadenza</th><th className="text-right">Imp.</th><th className="text-right">IVA</th><th className="text-right">Totale</th><th>Pagamento</th><th>Righe</th><th></th></tr>
            </thead>
            <tbody>
              {invoices.map(i => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="p-3 font-mono">{i.number}{i.series && `/${i.series}`}</td>
                  <td>{i.supplierName}</td>
                  <td className="text-xs">{formatDate(i.issueDate)}</td>
                  <td className="text-xs">{i.dueDate ? formatDate(i.dueDate) : "—"}</td>
                  <td className="text-right">{formatCurrency(i.subtotal)}</td>
                  <td className="text-right">{formatCurrency(i.vatTotal)}</td>
                  <td className="text-right font-semibold">{formatCurrency(i.total)}</td>
                  <td><Badge variant={i.paymentStatus === "PAID" ? "success" : i.paymentStatus === "OVERDUE" ? "destructive" : "warning"}>{t(i.paymentStatus)}</Badge></td>
                  <td className="text-xs">{i.lines?.length || 0}</td>
                  <td><Link href={`/admin/purchase-invoices/${i.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent></Card>
      )}
    </div>
  );
}
