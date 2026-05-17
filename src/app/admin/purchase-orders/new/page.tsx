"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ supplierId: "", shippingCost: 0 });
  const [lines, setLines] = useState<any[]>([{ description: "", quantity: 1, unit: "pz", unitPrice: 0, vatRate: 22 }]);

  useEffect(() => {
    fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || []));
    fetch("/api/warehouses").then(r => r.json()).then(d => setWarehouses(d.warehouses || []));
  }, []);

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100), 0);
  const total = subtotal + vat + Number(form.shippingCost || 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/purchase-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, lines }) });
      if (!res.ok) throw new Error("Errore");
      const { order } = await res.json();
      toast.success("Ordine creato");
      router.push(`/admin/purchase-orders/${order.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-5xl mx-auto">
      <PageHeader title="Nuovo ordine fornitore" back="/admin/purchase-orders" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>} />
      <Card><CardContent className="p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Fornitore *</Label>
            <Select required value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Magazzino destinazione</Label>
            <Select value={form.warehouseId || ""} onChange={e => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">—</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>
          <div><Label>Data prevista consegna</Label><Input type="date" value={form.expectedDate || ""} onChange={e => setForm({ ...form, expectedDate: e.target.value })} /></div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label className="m-0">Righe ordine</Label>
            <Button type="button" size="sm" variant="outline" onClick={() => setLines([...lines, { description: "", quantity: 1, unit: "pz", unitPrice: 0, vatRate: 22 }])}><Plus className="h-3 w-3" /> Aggiungi</Button>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/30 rounded-lg">
                <Input className="col-span-12 md:col-span-3" placeholder="Codice METEL" value={l.materialCode || ""} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, materialCode: e.target.value } : x))} />
                <Input className="col-span-12 md:col-span-4" placeholder="Descrizione" value={l.description} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, description: e.target.value } : x))} required />
                <Input className="col-span-3 md:col-span-1" type="number" step="0.01" value={l.quantity} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))} />
                <Input className="col-span-3 md:col-span-1" value={l.unit} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x))} />
                <Input className="col-span-3 md:col-span-2" type="number" step="0.01" value={l.unitPrice} onChange={e => setLines(ls => ls.map((x, idx) => idx === i ? { ...x, unitPrice: Number(e.target.value) } : x))} />
                <Button type="button" variant="ghost" size="icon" className="col-span-3 md:col-span-1" onClick={() => setLines(ls => ls.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Spese di spedizione €</Label><Input type="number" step="0.01" value={form.shippingCost} onChange={e => setForm({ ...form, shippingCost: Number(e.target.value) })} /></div>
          <div className="text-right space-y-1">
            <div>Imponibile: <strong>{formatCurrency(subtotal)}</strong></div>
            <div>IVA: <strong>{formatCurrency(vat)}</strong></div>
            <div className="text-xl font-bold text-primary">Totale: {formatCurrency(total)}</div>
          </div>
        </div>

        <div><Label>Note</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
      </CardContent></Card>
    </form>
  );
}
