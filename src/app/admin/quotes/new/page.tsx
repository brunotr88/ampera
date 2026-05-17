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

type Line = { description: string; quantity: number; unit: string; unitPrice: number; discountPercent: number; vatRate: number; code?: string };

function NewQuoteForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ customerId: sp.get("customerId") || "", title: "", defaultVatRate: 22, discountPercent: 0 });
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: 22 }]);

  useEffect(() => { fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || [])); }, []);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const discount = subtotal * (form.discountPercent / 100);
  const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (l.vatRate / 100), 0);
  const total = subtotal - discount + vat;

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerId || !form.title) return toast.error("Cliente e titolo obbligatori");
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, lines }) });
      if (!res.ok) throw new Error("Errore");
      const { quote } = await res.json();
      toast.success("Preventivo creato");
      router.push(`/admin/quotes/${quote.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto">
      <PageHeader title="Nuovo preventivo" back="/admin/quotes" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>} />

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Cliente *</Label>
              <Select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">— Seleziona —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`}</option>)}
              </Select>
            </div>
            <div className="md:col-span-2"><Label>Titolo *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Rifacimento impianto elettrico" /></div>
            <div><Label>Valido fino al</Label><Input type="date" value={form.validUntil || ""} onChange={e => setForm({ ...form, validUntil: e.target.value })} /></div>
            <div><Label>IVA default %</Label><Input type="number" min="0" max="50" step="1" value={form.defaultVatRate} onChange={e => setForm({ ...form, defaultVatRate: Number(e.target.value) })} /></div>
            <div><Label>Sconto globale %</Label><Input type="number" min="0" max="100" step="0.5" value={form.discountPercent} onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })} /></div>
            <div className="md:col-span-3"><Label>Descrizione</Label><Textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label className="m-0">Righe preventivo</Label>
              <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: form.defaultVatRate }])}><Plus className="h-3 w-3" /> Aggiungi</Button>
            </div>
            <div className="space-y-2">
              {lines.map((l, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg">
                  <Input className="col-span-12 md:col-span-4" placeholder="Descrizione voce" value={l.description} onChange={e => updateLine(i, { description: e.target.value })} required />
                  <Input className="col-span-3 md:col-span-1" type="number" step="0.01" placeholder="Qta" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} />
                  <Input className="col-span-3 md:col-span-1" placeholder="UM" value={l.unit} onChange={e => updateLine(i, { unit: e.target.value })} />
                  <Input className="col-span-3 md:col-span-2" type="number" step="0.01" placeholder="Prezzo" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} />
                  <Input className="col-span-3 md:col-span-1" type="number" step="0.5" placeholder="Sc%" value={l.discountPercent} onChange={e => updateLine(i, { discountPercent: Number(e.target.value) })} />
                  <Input className="col-span-6 md:col-span-1" type="number" step="1" placeholder="IVA" value={l.vatRate} onChange={e => updateLine(i, { vatRate: Number(e.target.value) })} />
                  <div className="col-span-4 md:col-span-1 text-right font-semibold">{formatCurrency(l.quantity * l.unitPrice * (1 - l.discountPercent / 100))}</div>
                  <Button type="button" variant="ghost" size="icon" className="col-span-2 md:col-span-1" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className="ml-auto max-w-xs space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Imponibile</span><span>{formatCurrency(subtotal - discount)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{formatCurrency(vat)}</span></div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Totale</span><span className="text-primary">{formatCurrency(total)}</span></div>
          </div>

          <div><Label>Condizioni</Label><Textarea rows={3} value={form.terms || ""} onChange={e => setForm({ ...form, terms: e.target.value })} placeholder="Validità 30 giorni. Acconto 30% all'ordine, saldo a fine lavori." /></div>
        </CardContent>
      </Card>
    </form>
  );
}

export default function NewQuotePage() { return <Suspense><NewQuoteForm /></Suspense>; }
