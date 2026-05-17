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
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewVehiclePage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type: "VAN", currentKm: 0, fuelType: "Diesel" });

  useEffect(() => { fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || [])); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { vehicle } = await res.json();
      toast.success("Veicolo registrato");
      router.push(`/admin/vehicles/${vehicle.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo veicolo" back="/admin/vehicles"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Registra</Button>} />

      <Card>
        <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Targa *</Label><Input required value={form.plate || ""} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} placeholder="AB123CD" maxLength={10} /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="VAN">Furgone</option><option value="TRUCK">Camion</option><option value="CAR">Auto</option>
              <option value="ELECTRIC">Elettrico</option><option value="MOTORCYCLE">Moto</option>
              <option value="TRAILER">Rimorchio</option><option value="OTHER">Altro</option>
            </Select>
          </div>
          <div><Label>Marca</Label><Input value={form.brand || ""} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Fiat / Iveco / Renault" /></div>
          <div><Label>Modello</Label><Input value={form.model || ""} onChange={e => setForm({ ...form, model: e.target.value })} placeholder="Ducato / Daily / Master" /></div>
          <div><Label>Anno immatricolazione</Label><Input type="number" min="1990" max="2030" value={form.year || ""} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
          <div>
            <Label>Carburante</Label>
            <Select value={form.fuelType} onChange={e => setForm({ ...form, fuelType: e.target.value })}>
              <option>Diesel</option><option>Benzina</option><option>GPL</option><option>Metano</option><option>Elettrico</option><option>Ibrido</option>
            </Select>
          </div>
          <div><Label>Km attuali</Label><Input type="number" min="0" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: Number(e.target.value) })} /></div>
          <div>
            <Label>Assegnato a</Label>
            <Select value={form.assignedToId || ""} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
              <option value="">— Nessuno —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>Scadenze</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Compagnia assicurativa</Label><Input value={form.insuranceCompany || ""} onChange={e => setForm({ ...form, insuranceCompany: e.target.value })} /></div>
          <div><Label>N. polizza</Label><Input value={form.insurancePolicyNo || ""} onChange={e => setForm({ ...form, insurancePolicyNo: e.target.value })} /></div>
          <div><Label>Scadenza assicurazione</Label><Input type="date" value={form.insuranceExpiry || ""} onChange={e => setForm({ ...form, insuranceExpiry: e.target.value })} /></div>
          <div><Label>Scadenza revisione</Label><Input type="date" value={form.inspectionExpiry || ""} onChange={e => setForm({ ...form, inspectionExpiry: e.target.value })} /></div>
          <div><Label>Prossimo tagliando (data)</Label><Input type="date" value={form.maintenanceExpiry || ""} onChange={e => setForm({ ...form, maintenanceExpiry: e.target.value })} /></div>
          <div><Label>Prossimo tagliando (km)</Label><Input type="number" min="0" value={form.maintenanceKmDue || ""} onChange={e => setForm({ ...form, maintenanceKmDue: e.target.value })} /></div>
          <div><Label>Scadenza bollo</Label><Input type="date" value={form.bolloExpiry || ""} onChange={e => setForm({ ...form, bolloExpiry: e.target.value })} /></div>
          <div><Label>Data acquisto</Label><Input type="date" value={form.purchaseDate || ""} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} /></div>
          <div><Label>Prezzo acquisto €</Label><Input type="number" step="0.01" value={form.purchasePrice || ""} onChange={e => setForm({ ...form, purchasePrice: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Note</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent>
      </Card>
    </form>
  );
}
