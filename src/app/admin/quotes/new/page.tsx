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
import { PriceListPicker } from "@/components/app/price-list-picker";

type Line = { description: string; quantity: number; unit: string; unitPrice: number; discountPercent: number; discountAmount: number; vatRate: number; code?: string; vatNote?: string; priceListEntryId?: string | null };

const VAT_OPTIONS = [
  { rate: 22, label: "22% standard" },
  { rate: 10, label: "10% ristrutturazione" },
  { rate: 4, label: "4% prima casa/accessibilità" },
  { rate: 5, label: "5% sociale" },
  { rate: 0, label: "0% non imponibile/esente" },
];

function NewQuoteForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ customerId: sp.get("customerId") || "", title: "", defaultVatRate: 22, discountPercent: 0 });
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, discountAmount: 0, vatRate: 22 }]);

  useEffect(() => { fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || [])); }, []);

  const lineComputed = lines.map(l => {
    const gross = l.quantity * l.unitPrice;
    const afterPct = gross * (1 - l.discountPercent / 100);
    const imponibile = Math.max(0, afterPct - (l.discountAmount || 0));
    return { imponibile, vat: imponibile * (l.vatRate / 100), total: imponibile * (1 + l.vatRate / 100) };
  });
  const subtotalLines = lineComputed.reduce((s, l) => s + l.imponibile, 0);
  const vat = lineComputed.reduce((s, l) => s + l.vat, 0);
  const discount = subtotalLines * (form.discountPercent / 100);
  const subtotal = subtotalLines - discount;
  const total = subtotal + vat;

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
              <div className="flex gap-2">
                <PriceListPicker
                  onPick={(e) => setLines([...lines, {
                    description: e.description, code: e.code, priceListEntryId: e.id,
                    quantity: 1, unit: e.unit, unitPrice: e.unitPrice,
                    discountPercent: 0, discountAmount: 0, vatRate: form.defaultVatRate,
                  }])}
                  buttonLabel="Aggiungi da prezzario"
                />
                <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, discountAmount: 0, vatRate: form.defaultVatRate }])}><Plus className="h-3 w-3" /> Manuale</Button>
              </div>
            </div>
            <div className="space-y-3">
              {lines.map((l, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-lg space-y-2">
                  {l.code && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      📖 Prezzario: <span className="font-semibold">{l.code}</span>
                      {l.priceListEntryId && <button type="button" className="ml-2 text-amber-600 dark:text-amber-400 hover:underline" onClick={() => updateLine(i, { priceListEntryId: null, code: undefined } as any)}>scollega</button>}
                    </div>
                  )}
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <Input className="col-span-12 md:col-span-6" placeholder="Descrizione" value={l.description} onChange={e => updateLine(i, { description: e.target.value })} required />
                    <Input className="col-span-3 md:col-span-1" type="number" step="0.01" placeholder="Qta" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} />
                    <Input className="col-span-3 md:col-span-1" placeholder="UM" value={l.unit} onChange={e => updateLine(i, { unit: e.target.value })} />
                    <Input className="col-span-3 md:col-span-2" type="number" step="0.01" placeholder="Prezzo €" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} />
                    <div className="col-span-3 md:col-span-2 text-right font-semibold pt-2">{formatCurrency(lineComputed[i].total)}</div>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-center text-xs">
                    <div className="col-span-2 text-muted-foreground">Sconto:</div>
                    <Input className="col-span-2" type="number" step="0.5" min="0" max="100" placeholder="% sconto" title="Sconto in percentuale" value={l.discountPercent} onChange={e => updateLine(i, { discountPercent: Number(e.target.value) })} />
                    <Input className="col-span-2" type="number" step="0.01" min="0" placeholder="€ sconto" title="Sconto in valore (oltre alla %)" value={l.discountAmount} onChange={e => updateLine(i, { discountAmount: Number(e.target.value) })} />
                    <div className="col-span-2 text-muted-foreground">IVA:</div>
                    <select className="col-span-3 h-9 rounded-md border border-input bg-background px-2" value={l.vatRate} onChange={e => updateLine(i, { vatRate: Number(e.target.value) })}>
                      {VAT_OPTIONS.map(o => <option key={o.rate} value={o.rate}>{o.label}</option>)}
                    </select>
                    <Button type="button" variant="ghost" size="icon" className="col-span-1 h-9 w-9" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  {l.vatRate === 0 && (
                    <Input placeholder="Nota IVA (es. art. 8/A DPR 633/72 - non imponibile)" value={l.vatNote || ""} onChange={e => updateLine(i, { vatNote: e.target.value } as any)} className="text-xs" />
                  )}
                  <Input placeholder="Nota commento riga (opzionale, stampata in preventivo)" value={(l as any).lineNote || ""} onChange={e => updateLine(i, { lineNote: e.target.value } as any)} className="text-xs" />
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
