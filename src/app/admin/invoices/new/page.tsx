"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

function NewInvoiceForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    customerId: "", type: "INVOICE", issueDate: new Date().toISOString().slice(0, 10),
    withholdingTax: 0, splitPayment: false, reverseCharge: false, stampDuty: 0,
  });
  const [lines, setLines] = useState<any[]>([{ description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: 22 }]);

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
    const fromQuote = sp.get("fromQuote");
    if (fromQuote) {
      fetch(`/api/quotes`).then(r => r.json()).then(d => {
        const q = d.quotes?.find((x: any) => x.id === fromQuote);
        if (q) setForm((f: any) => ({ ...f, customerId: q.customerId }));
      });
    }
  }, [sp]);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (l.vatRate / 100), 0);
  const total = subtotal + vat + Number(form.stampDuty || 0) - Number(form.withholdingTax || 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, lines }) });
      if (!res.ok) throw new Error("Errore");
      const { invoice } = await res.json();
      toast.success("Fattura creata");
      router.push(`/admin/invoices/${invoice.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto">
      <PageHeader title="Nuova fattura" back="/admin/invoices" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea</Button>} />
      <Card><CardContent className="p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="INVOICE">Fattura (TD01)</option>
              <option value="CREDIT_NOTE">Nota credito (TD04)</option>
              <option value="PROFORMA">Proforma (TD06)</option>
              <option value="TD24_DEFERRED">Differita (TD24)</option>
              <option value="TD20_SELF">Autofattura (TD20)</option>
            </Select>
          </div>
          <div>
            <Label>Cliente *</Label>
            <Select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`}</option>)}
            </Select>
          </div>
          <div><Label>Serie</Label><Input value={form.series || ""} onChange={e => setForm({ ...form, series: e.target.value })} placeholder="A" /></div>
          <div><Label>Data emissione</Label><Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
          <div><Label>Scadenza</Label><Input type="date" value={form.dueDate || ""} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div><Label>Modalità pagamento</Label><Input value={form.paymentMethod || ""} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} placeholder="Bonifico 30gg DF" /></div>
          <div><Label>Bollo €</Label><Input type="number" step="0.01" value={form.stampDuty} onChange={e => setForm({ ...form, stampDuty: Number(e.target.value) })} /></div>
          <div><Label>Ritenuta d'acconto €</Label><Input type="number" step="0.01" value={form.withholdingTax} onChange={e => setForm({ ...form, withholdingTax: Number(e.target.value) })} /></div>
          <div className="flex items-end gap-3 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.splitPayment} onChange={e => setForm({ ...form, splitPayment: e.target.checked })} /> Split payment</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.reverseCharge} onChange={e => setForm({ ...form, reverseCharge: e.target.checked })} /> Reverse charge</label>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="m-0">Righe fattura</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: 22 }])}><Plus className="h-3 w-3" /> Aggiungi riga</Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg">
                <Input className="col-span-12 md:col-span-5" placeholder="Descrizione" value={l.description} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} required />
                <Input className="col-span-3 md:col-span-1" type="number" step="0.01" value={l.quantity} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))} />
                <Input className="col-span-3 md:col-span-1" value={l.unit} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} />
                <Input className="col-span-3 md:col-span-2" type="number" step="0.01" value={l.unitPrice} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, unitPrice: Number(e.target.value) } : x))} />
                <Input className="col-span-3 md:col-span-1" type="number" step="0.5" value={l.discountPercent} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, discountPercent: Number(e.target.value) } : x))} />
                <Input className="col-span-3 md:col-span-1" type="number" step="1" value={l.vatRate} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, vatRate: Number(e.target.value) } : x))} />
                <Button type="button" variant="ghost" size="icon" className="col-span-3 md:col-span-1" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><span>Imponibile</span><span>{formatCurrency(subtotal)}</span></div>
          <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(vat)}</span></div>
          {form.stampDuty > 0 && <div className="flex justify-between"><span>Bollo</span><span>{formatCurrency(Number(form.stampDuty))}</span></div>}
          {form.withholdingTax > 0 && <div className="flex justify-between"><span>Ritenuta</span><span>-{formatCurrency(Number(form.withholdingTax))}</span></div>}
          <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Totale</span><span className="text-primary">{formatCurrency(total)}</span></div>
        </div>

        <div><Label>Note</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </CardContent></Card>
    </form>
  );
}

export default function NewInvoicePage() { return <Suspense><NewInvoiceForm /></Suspense>; }
