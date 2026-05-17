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

function NewPlantForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ customerId: sp.get("customerId") || "", type: "CIVIL", name: "" });

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/plants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      const { plant } = await res.json();
      toast.success("Impianto creato");
      router.push(`/admin/plants/${plant.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo impianto" back="/admin/plants" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Cliente *</Label>
            <Select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Nome impianto *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Quadro generale piano 1" /></div>
          <div><Label>Codice</Label><Input value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
          <div>
            <Label>Tipo *</Label>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="CIVIL">Civile</option><option value="INDUSTRIAL">Industriale</option>
              <option value="PHOTOVOLTAIC">Fotovoltaico</option><option value="DOMOTIC">Domotica</option>
              <option value="EMERGENCY">Emergenza</option><option value="FIRE_ALARM">Antincendio</option>
              <option value="HVAC">HVAC</option><option value="CHARGING_STATION">Colonnina ricarica</option><option value="TLC">TLC</option>
            </Select>
          </div>
          <div><Label>Potenza (kW)</Label><Input type="number" step="0.1" value={form.ratedPowerKw || ""} onChange={e => setForm({ ...form, ratedPowerKw: e.target.value })} /></div>
          <div><Label>Tensione (V)</Label><Input type="number" value={form.voltageV || ""} onChange={e => setForm({ ...form, voltageV: e.target.value })} /></div>
          <div><Label>Data installazione</Label><Input type="date" value={form.installDate || ""} onChange={e => setForm({ ...form, installDate: e.target.value })} /></div>
          <div><Label>Ultima verifica</Label><Input type="date" value={form.lastCheckDate || ""} onChange={e => setForm({ ...form, lastCheckDate: e.target.value })} /></div>
          <div><Label>Prossima verifica</Label><Input type="date" value={form.nextCheckDate || ""} onChange={e => setForm({ ...form, nextCheckDate: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Note</Label><Textarea rows={3} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </CardContent></Card>
    </form>
  );
}

export default function NewPlantPage() {
  return <Suspense><NewPlantForm /></Suspense>;
}
