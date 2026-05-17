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

function NewContractForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    customerId: sp.get("customerId") || "",
    name: "",
    frequencyMonths: 12,
    feeMonthly: 0,
    nextDueDate: "",
    startDate: new Date().toISOString().slice(0, 10),
    notifyDaysBefore: 30,
    autoInvoice: false,
  });

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);
  useEffect(() => {
    if (form.customerId) fetch(`/api/plants?customerId=${form.customerId}`).then(r => r.json()).then(d => setPlants(d.plants || []));
  }, [form.customerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/contracts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Contratto creato");
      router.push("/admin/contracts");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo contratto manutenzione" back="/admin/contracts"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Nome contratto *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Manutenzione annuale impianto FV" /></div>
          <div>
            <Label>Cliente *</Label>
            <Select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Impianto</Label>
            <Select value={form.plantId || ""} onChange={e => setForm({ ...form, plantId: e.target.value })}>
              <option value="">—</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div><Label>Frequenza (mesi)</Label><Input type="number" min="1" value={form.frequencyMonths} onChange={e => setForm({ ...form, frequencyMonths: Number(e.target.value) })} /></div>
          <div><Label>Canone mensile €</Label><Input type="number" step="0.01" value={form.feeMonthly} onChange={e => setForm({ ...form, feeMonthly: Number(e.target.value) })} /></div>
          <div><Label>Inizio *</Label><Input type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><Label>Fine (opzionale)</Label><Input type="date" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          <div><Label>Prossima scadenza *</Label><Input type="date" required value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} /></div>
          <div><Label>Avviso prima (gg)</Label><Input type="number" min="1" value={form.notifyDaysBefore} onChange={e => setForm({ ...form, notifyDaysBefore: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="md:col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" id="auto" checked={form.autoInvoice} onChange={e => setForm({ ...form, autoInvoice: e.target.checked })} />
            <label htmlFor="auto">Genera fattura automaticamente a ogni scadenza</label>
          </div>
        </div>
      </CardContent></Card>
    </form>
  );
}

export default function NewContractPage() { return <Suspense><NewContractForm /></Suspense>; }
