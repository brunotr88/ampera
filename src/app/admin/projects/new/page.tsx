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
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ budgetMaterials: 0, budgetLabor: 0, budgetIndirect: 0 });

  useEffect(() => { fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || [])); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Commessa creata");
      router.push("/admin/projects");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuova commessa" back="/admin/projects" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Codice *</Label><Input required value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="C2026-001" /></div>
          <div>
            <Label>Cliente *</Label>
            <Select required value={form.customerId || ""} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Nome commessa *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rifacimento impianto capannone industriale" /></div>
          <div><Label>Inizio</Label><Input type="date" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><Label>Fine prevista</Label><Input type="date" value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          <div><Label>Budget materiali €</Label><Input type="number" step="0.01" value={form.budgetMaterials} onChange={e => setForm({ ...form, budgetMaterials: Number(e.target.value) })} /></div>
          <div><Label>Budget manodopera €</Label><Input type="number" step="0.01" value={form.budgetLabor} onChange={e => setForm({ ...form, budgetLabor: Number(e.target.value) })} /></div>
          <div><Label>Budget indiretti €</Label><Input type="number" step="0.01" value={form.budgetIndirect} onChange={e => setForm({ ...form, budgetIndirect: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={3} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </CardContent></Card>
    </form>
  );
}
