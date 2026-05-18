"use client";
import { useEffect, useState } from "react";
import { tr } from "@/lib/labels";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Truck } from "lucide-react";
import { toast } from "sonner";

export default function POSinglePage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [received, setReceived] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`/api/purchase-orders`).then(r => r.json()).then(d => {
      const o = d.orders?.find((x: any) => x.id === params.id);
      setOrder(o);
      if (o) setReceived(Object.fromEntries(o.lines.map((l: any) => [l.id, l.receivedQty || 0])));
    });
  }, [params.id]);

  if (!order) return <div className="p-6 text-muted-foreground">Caricamento…</div>;

  async function receive() {
    const payload = { action: "receive", received: order.lines.map((l: any) => ({ lineId: l.id, quantity: Number(received[l.id] || 0) })) };
    const res = await fetch(`/api/purchase-orders/${order.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { toast.success("Merce caricata"); router.refresh(); window.location.reload(); }
    else toast.error("Errore");
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Ordine ${order.number}`} description={`${order.supplier.name} · ${formatDate(order.issueDate)}`} back="/admin/purchase-orders"
        actions={<Button onClick={receive}><Truck className="h-4 w-4" /> Conferma ricevimento</Button>} />
      <Card>
        <CardHeader><CardTitle>Righe ({order.lines.length})</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-muted-foreground uppercase"><th className="text-left pb-2">Codice</th><th className="text-left">Descrizione</th><th className="text-right">Ordinata</th><th className="text-right">Ricevuta</th><th className="text-right">Prezzo</th><th className="text-right">Totale</th></tr></thead>
            <tbody>
              {order.lines.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{l.materialCode || "—"}</td>
                  <td>{l.description}</td>
                  <td className="text-right">{l.quantity}</td>
                  <td className="text-right">
                    <Input type="number" step="0.01" min="0" max={l.quantity} value={received[l.id] ?? 0} onChange={e => setReceived(r => ({ ...r, [l.id]: Number(e.target.value) }))} className="w-24 inline-block text-right" />
                  </td>
                  <td className="text-right">{formatCurrency(l.unitPrice)}</td>
                  <td className="text-right font-semibold">{formatCurrency(l.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between">
            <Badge variant="outline">Stato: {order.status}</Badge>
            <div className="text-right">
              <div>Imp: {formatCurrency(order.subtotal)} · IVA: {formatCurrency(order.vatTotal)}</div>
              <div className="text-xl font-bold text-primary">{formatCurrency(order.total)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
