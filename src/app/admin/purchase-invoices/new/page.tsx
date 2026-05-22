"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Trash2, Plus, Package, Building2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Line = {
  type: "WAREHOUSE" | "ASSET" | "EXPENSE" | "CONSUMABLE";
  description: string;
  materialCode?: string;
  lineNote?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  vatRate: number;
  warehouseId?: string;
  amortizationYears?: number;
};

const LINE_TYPE_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  WAREHOUSE: { label: "Magazzino", icon: Package, color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 dark:text-emerald-300" },
  ASSET: { label: "Cespite", icon: Building2, color: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300" },
  EXPENSE: { label: "Costo", icon: Receipt, color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 dark:text-amber-300" },
  CONSUMABLE: { label: "Consumo", icon: Receipt, color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 dark:text-sky-300" },
};

export default function NewPurchaseInvoicePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    issueDate: new Date().toISOString().slice(0, 10),
    receiveDate: new Date().toISOString().slice(0, 10),
    shippingCost: 0,
    reverseCharge: false,
  });
  const [lines, setLines] = useState<Line[]>([
    { type: "WAREHOUSE", description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: 22 },
  ]);

  useEffect(() => {
    fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
    fetch("/api/warehouses").then(r => r.json()).then(d => setWarehouses(d.warehouses || []));
  }, []);

  function updateLine(i: number, patch: Partial<Line>) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  }

  const computed = lines.map(l => {
    const gross = l.quantity * l.unitPrice;
    const disc = gross * (1 - l.discountPercent / 100);
    return { imp: disc, vat: disc * (l.vatRate / 100), total: disc * (1 + l.vatRate / 100) };
  });
  const subtotal = computed.reduce((s, l) => s + l.imp, 0);
  const vatTotal = computed.reduce((s, l) => s + l.vat, 0);
  const total = subtotal + vatTotal + Number(form.shippingCost || 0) - Number(form.withholdingTax || 0);

  // Helpful breakdown by line type
  const byType = { WAREHOUSE: 0, ASSET: 0, EXPENSE: 0, CONSUMABLE: 0 };
  computed.forEach((c, i) => { byType[lines[i].type] = (byType[lines[i].type] || 0) + c.total; });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplierId) return toast.error("Seleziona fornitore");
    if (!form.number) return toast.error("Numero fattura obbligatorio");
    if (lines.some(l => l.type === "WAREHOUSE" && !l.warehouseId)) return toast.error("Seleziona magazzino per ogni riga di tipo Magazzino");
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-invoices", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, lines }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Fattura registrata. Materiali caricati, cespiti creati.");
      router.push("/admin/purchase-invoices");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto">
      <PageHeader title="Registra fattura acquisto" back="/admin/purchase-invoices"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registra</Button>} />

      <Card>
        <CardHeader><CardTitle>Dati fattura</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <Label>Fornitore *</Label>
            <Select required value={form.supplierId || ""} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div><Label>Numero *</Label><Input required value={form.number || ""} onChange={e => setForm({ ...form, number: e.target.value })} placeholder="2026/0123" /></div>
          <div><Label>Serie</Label><Input value={form.series || ""} onChange={e => setForm({ ...form, series: e.target.value })} placeholder="A" /></div>
          <div><Label>Data emissione *</Label><Input type="date" required value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
          <div><Label>Data ricezione</Label><Input type="date" value={form.receiveDate || ""} onChange={e => setForm({ ...form, receiveDate: e.target.value })} /></div>
          <div><Label>Scadenza pagamento</Label><Input type="date" value={form.dueDate || ""} onChange={e => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div className="md:col-span-3 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.reverseCharge} onChange={e => setForm({ ...form, reverseCharge: e.target.checked })} />
              Reverse charge (art. 17 c. 6 DPR 633/72)
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Righe fattura ({lines.length})
            <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { type: "WAREHOUSE", description: "", quantity: 1, unit: "pz", unitPrice: 0, discountPercent: 0, vatRate: 22 }])}>
              <Plus className="h-3 w-3" /> Aggiungi riga
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-3">
            Per ogni riga scegli la destinazione: <strong>Magazzino</strong> (carico stock), <strong>Cespite</strong> (crea voce ammortabile), <strong>Costo</strong> (costo passante), <strong>Consumo</strong> (uso immediato senza magazzino).
          </div>

          <div className="space-y-3">
            {lines.map((l, i) => {
              const t = LINE_TYPE_LABELS[l.type];
              const Icon = t.icon;
              return (
                <div key={i} className="border rounded-xl p-3 space-y-3 bg-card">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-12 md:col-span-3">
                      <Label className="text-xs">Destinazione</Label>
                      <Select value={l.type} onChange={e => updateLine(i, { type: e.target.value as any })}>
                        <option value="WAREHOUSE">📦 Magazzino (carico)</option>
                        <option value="ASSET">🏢 Cespite (bene strumentale)</option>
                        <option value="EXPENSE">💰 Costo (operativo)</option>
                        <option value="CONSUMABLE">🔧 Consumo diretto</option>
                      </Select>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <Label className="text-xs">Descrizione *</Label>
                      <Input required value={l.description} onChange={e => updateLine(i, { description: e.target.value })} placeholder="Articolo / servizio" />
                    </div>
                    <div className="col-span-12 md:col-span-3 flex items-end gap-2">
                      <Badge className={`${t.color} text-xs`}><Icon className="h-3 w-3 mr-1" /> {t.label}</Badge>
                      {lines.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3 md:col-span-1"><Label className="text-xs">Q.tà</Label><Input type="number" step="0.01" value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} /></div>
                    <div className="col-span-2 md:col-span-1"><Label className="text-xs">UM</Label><Input value={l.unit} onChange={e => updateLine(i, { unit: e.target.value })} /></div>
                    <div className="col-span-3 md:col-span-2"><Label className="text-xs">Prezzo €</Label><Input type="number" step="0.01" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} /></div>
                    <div className="col-span-2 md:col-span-1"><Label className="text-xs">Sc%</Label><Input type="number" value={l.discountPercent} onChange={e => updateLine(i, { discountPercent: Number(e.target.value) })} /></div>
                    <div className="col-span-2 md:col-span-1">
                      <Label className="text-xs">IVA %</Label>
                      <Select value={l.vatRate} onChange={e => updateLine(i, { vatRate: Number(e.target.value) })}>
                        <option value="22">22%</option><option value="10">10%</option><option value="4">4%</option><option value="0">0%</option>
                      </Select>
                    </div>
                    <div className="col-span-12 md:col-span-2 text-right">
                      <Label className="text-xs">Totale</Label>
                      <div className="font-semibold text-lg pt-1">{formatCurrency(computed[i].total)}</div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <Label className="text-xs">{l.type === "WAREHOUSE" ? "Magazzino destinazione *" : l.type === "ASSET" ? "Anni ammortamento" : "—"}</Label>
                      {l.type === "WAREHOUSE" && (
                        <Select required value={l.warehouseId || ""} onChange={e => updateLine(i, { warehouseId: e.target.value })}>
                          <option value="">— Seleziona —</option>
                          {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </Select>
                      )}
                      {l.type === "ASSET" && (
                        <Input type="number" min="1" max="50" value={l.amortizationYears || 5} onChange={e => updateLine(i, { amortizationYears: Number(e.target.value) })} />
                      )}
                      {(l.type === "EXPENSE" || l.type === "CONSUMABLE") && (
                        <div className="h-10 px-3 py-2 text-xs text-muted-foreground bg-muted/30 rounded-md flex items-center">
                          Non incide su magazzino o cespiti
                        </div>
                      )}
                    </div>
                  </div>

                  {l.type === "WAREHOUSE" && (
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-12 md:col-span-4">
                        <Label className="text-xs">Codice articolo (opz.)</Label>
                        <Input value={l.materialCode || ""} onChange={e => updateLine(i, { materialCode: e.target.value })} placeholder="Es. INT4X32 o METEL" />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs">Nota riga</Label>
                    <Input value={l.lineNote || ""} onChange={e => updateLine(i, { lineNote: e.target.value })} placeholder="Note specifiche per questa voce" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-4">
            <div className="space-y-2 text-sm">
              <div className="text-xs uppercase text-muted-foreground mb-2">Ripartizione</div>
              {Object.entries(byType).filter(([_, v]) => v > 0).map(([k, v]) => {
                const t = LINE_TYPE_LABELS[k];
                const Icon = t.icon;
                return <div key={k} className="flex justify-between"><span className="flex items-center gap-2"><Icon className="h-3 w-3" /> {t.label}</span><span>{formatCurrency(v)}</span></div>;
              })}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Imponibile</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>IVA</span><span>{formatCurrency(vatTotal)}</span></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div><Label className="text-xs">Spese spedizione €</Label><Input type="number" step="0.01" value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: Number(e.target.value) })} /></div>
                <div><Label className="text-xs">Ritenuta acconto €</Label><Input type="number" step="0.01" value={form.withholdingTax || 0} onChange={e => setForm({ ...form, withholdingTax: Number(e.target.value) })} /></div>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>TOTALE</span><span className="text-primary">{formatCurrency(total)}</span></div>
            </div>
          </div>

          <div className="mt-4">
            <Label>Note interne</Label>
            <Textarea rows={2} value={form.internalNotes || ""} onChange={e => setForm({ ...form, internalNotes: e.target.value })} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
