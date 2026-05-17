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

const CATEGORIES = ["Vendite", "Acquisti materiali", "Stipendi", "Tasse", "Affitto", "Utenze", "Carburante", "Manutenzione mezzi", "Spese bancarie", "Altro"];

function NewCashEntryForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [cashboxes, setCashboxes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    date: new Date().toISOString().slice(0, 10),
    direction: "IN",
    cashboxId: "",
    amount: 0,
    description: "",
    invoiceId: sp.get("invoiceId") || "",
  });

  useEffect(() => {
    fetch("/api/cashboxes").then(r => r.json()).then(d => {
      setCashboxes(d.cashboxes || []);
      if (d.cashboxes?.[0]) setForm((f: any) => ({ ...f, cashboxId: d.cashboxes[0].id }));
    });
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cashbook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Errore");
      toast.success("Movimento registrato");
      router.push("/admin/cashbook");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto">
      <PageHeader title="Nuovo movimento prima nota" back="/admin/cashbook" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registra</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Direzione *</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, direction: "IN" })} className={`flex-1 px-4 py-3 rounded-lg border font-semibold ${form.direction === "IN" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-card"}`}>+ Entrata</button>
              <button type="button" onClick={() => setForm({ ...form, direction: "OUT" })} className={`flex-1 px-4 py-3 rounded-lg border font-semibold ${form.direction === "OUT" ? "bg-amber-50 border-amber-300 text-amber-700" : "bg-card"}`}>- Uscita</button>
            </div>
          </div>
          <div>
            <Label>Cassa / Conto *</Label>
            <Select required value={form.cashboxId} onChange={e => setForm({ ...form, cashboxId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {cashboxes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
            </Select>
          </div>
          <div><Label>Data *</Label><Input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
          <div><Label>Importo € *</Label><Input type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>Descrizione *</Label><Input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Es: Saldo fattura 0125/2026 cliente Rossi" /></div>
          <div>
            <Label>Categoria</Label>
            <Select value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">—</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div>
            <Label>Cliente / Fornitore</Label>
            <Select value={form.customerId || ""} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">—</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
            </Select>
          </div>
          <div><Label>Riferimento documento</Label><Input value={form.documentRef || ""} onChange={e => setForm({ ...form, documentRef: e.target.value })} placeholder="N. fattura, DDT, contratto" /></div>
          <div>
            <Label>Metodo pagamento</Label>
            <Select value={form.paymentMethod || ""} onChange={e => setForm({ ...form, paymentMethod: e.target.value })}>
              <option value="">—</option>
              <option>Contanti</option><option>Bonifico</option><option>POS</option><option>Assegno</option><option>RID</option><option>Carta credito</option>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Note</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </CardContent></Card>
    </form>
  );
}

export default function NewCashEntryPage() { return <Suspense><NewCashEntryForm /></Suspense>; }
