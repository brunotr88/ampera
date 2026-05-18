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
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PurchaseInvoicePicker } from "@/components/app/purchase-invoice-picker";

const CATEGORIES = ["Macchinari", "Attrezzature", "Hardware/Informatica", "Mobili", "Veicoli", "Software", "Altro"];

function NewAssetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    acquisitionDate: new Date().toISOString().slice(0, 10),
    purchasePrice: 0, vatRate: 22, amortizationYears: 5,
    category: "Attrezzature",
    invoiceRef: sp.get("invoiceRef") || "",
  });

  useEffect(() => { fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || [])); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/assets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Cespite registrato");
      router.push("/admin/assets");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo cespite" back="/admin/assets"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registra</Button>} />
      <Card><CardContent className="p-6 grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2"><Label>Nome cespite *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es. Trapano percussore Bosch GBH 5-40" /></div>
        <div>
          <Label>Categoria</Label>
          <Select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <div><Label>N. serie / matricola</Label><Input value={form.serialNumber || ""} onChange={e => setForm({ ...form, serialNumber: e.target.value })} /></div>
        <div><Label>Data acquisto *</Label><Input type="date" required value={form.acquisitionDate} onChange={e => setForm({ ...form, acquisitionDate: e.target.value })} /></div>
        <div><Label>Prezzo acquisto (escl. IVA) €</Label><Input type="number" step="0.01" required value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></div>
        <div><Label>IVA %</Label><Input type="number" value={form.vatRate} onChange={e => setForm({ ...form, vatRate: Number(e.target.value) })} /></div>
        <div><Label>Anni ammortamento</Label><Input type="number" min="1" max="50" value={form.amortizationYears} onChange={e => setForm({ ...form, amortizationYears: Number(e.target.value) })} /></div>
        <div>
          <Label>Fornitore</Label>
          <Select value={form.supplierId || ""} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">—</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Fattura acquisto associata</Label>
          <PurchaseInvoicePicker
            value={form.purchaseInvoiceId}
            supplierId={form.supplierId}
            onChange={({ purchaseInvoiceId, invoiceRef, supplierId }) => setForm({
              ...form,
              purchaseInvoiceId: purchaseInvoiceId,
              invoiceRef: invoiceRef ?? form.invoiceRef,
              supplierId: supplierId ?? form.supplierId,
            })}
          />
          <p className="text-xs text-muted-foreground mt-1">Seleziona la fattura registrata per pre-compilare riferimento e fornitore.</p>
        </div>
        <div><Label>Riferimento fattura (manuale)</Label><Input value={form.invoiceRef || ""} onChange={e => setForm({ ...form, invoiceRef: e.target.value })} placeholder="Es. F. acquisto 0125 del 15/05/2026" /></div>
        <div className="md:col-span-2"><Label>Ubicazione</Label><Input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Es. Magazzino sede / Furgone Marco" /></div>
        <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      </CardContent></Card>
    </form>
  );
}

export default function NewAssetPage() { return <Suspense><NewAssetForm /></Suspense>; }
