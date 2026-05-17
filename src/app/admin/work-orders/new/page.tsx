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

function NewWOForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    customerId: sp.get("customerId") || "",
    plantId: sp.get("plantId") || "",
    title: "",
    priority: "NORMAL",
  });

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
    fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || []));
  }, []);

  useEffect(() => {
    if (form.customerId) fetch(`/api/plants?customerId=${form.customerId}`).then(r => r.json()).then(d => setPlants(d.plants || []));
  }, [form.customerId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/work-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      const { workOrder } = await res.json();
      toast.success("Intervento creato");
      router.push(`/admin/work-orders/${workOrder.id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo intervento" back="/admin/work-orders" actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Pianifica</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Titolo *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Sostituzione quadro generale" /></div>
          <div>
            <Label>Cliente *</Label>
            <Select required value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
              <option value="">— Seleziona —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`}</option>)}
            </Select>
          </div>
          <div>
            <Label>Impianto</Label>
            <Select value={form.plantId} onChange={e => setForm({ ...form, plantId: e.target.value })}>
              <option value="">—</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Tecnico assegnato</Label>
            <Select value={form.assignedToId || ""} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
              <option value="">— Da assegnare —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </Select>
          </div>
          <div>
            <Label>Priorità</Label>
            <Select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Bassa</option><option value="NORMAL">Normale</option><option value="URGENT">Urgente</option><option value="EMERGENCY">Emergenza</option>
            </Select>
          </div>
          <div><Label>Data programmata</Label><Input type="datetime-local" value={form.scheduledDate || ""} onChange={e => setForm({ ...form, scheduledDate: e.target.value })} /></div>
          <div><Label>Fine prevista</Label><Input type="datetime-local" value={form.scheduledEndDate || ""} onChange={e => setForm({ ...form, scheduledEndDate: e.target.value })} /></div>
          <div><Label>Tipo</Label><Input value={form.type || ""} onChange={e => setForm({ ...form, type: e.target.value })} placeholder="Manutenzione / Guasto / Installazione" /></div>
          <div><Label>Referente in loco</Label><Input value={form.contactPerson || ""} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={3} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </CardContent></Card>
    </form>
  );
}

export default function NewWO() { return <Suspense><NewWOForm /></Suspense>; }
