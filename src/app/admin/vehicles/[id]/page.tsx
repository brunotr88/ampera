"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Attachments } from "@/components/app/attachments";
import { formatDate, formatDateTime, formatCurrency, daysUntil } from "@/lib/utils";
import { tr } from "@/lib/labels";
import { Save, Loader2, Plus, Trash2, Fuel, Wrench, ShieldCheck, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";

function toDateInput(d: string | Date | null | undefined) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

const LOG_TYPES = [
  { v: "REFUEL", l: "Rifornimento", icon: "⛽" },
  { v: "MAINTENANCE", l: "Tagliando", icon: "🔧" },
  { v: "INSPECTION", l: "Revisione", icon: "📋" },
  { v: "INSURANCE_RENEWAL", l: "Rinnovo assicurazione", icon: "🛡️" },
  { v: "TIRE_CHANGE", l: "Cambio gomme", icon: "🛞" },
  { v: "REPAIR", l: "Riparazione", icon: "🔨" },
  { v: "CAR_WASH", l: "Lavaggio", icon: "🚿" },
  { v: "TOLL", l: "Pedaggio", icon: "🛣️" },
  { v: "PARKING", l: "Parcheggio", icon: "🅿️" },
  { v: "KM_LOG", l: "Registrazione km", icon: "📊" },
  { v: "ACCIDENT", l: "Sinistro", icon: "⚠️" },
  { v: "OTHER", l: "Altro", icon: "📝" },
];

export default function VehicleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [v, setV] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [logForm, setLogForm] = useState<any>({ type: "REFUEL", date: new Date().toISOString().slice(0, 10) });
  const [logOpen, setLogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  function load() {
    fetch(`/api/vehicles/${id}`).then(r => r.json()).then(d => {
      setV(d.vehicle);
      if (d.vehicle) {
        setForm({
          plate: d.vehicle.plate, brand: d.vehicle.brand || "", model: d.vehicle.model || "",
          type: d.vehicle.type, year: d.vehicle.year || "", fuelType: d.vehicle.fuelType || "",
          currentKm: d.vehicle.currentKm, assignedToId: d.vehicle.assignedToId || "",
          insuranceCompany: d.vehicle.insuranceCompany || "",
          insurancePolicyNo: d.vehicle.insurancePolicyNo || "",
          insuranceExpiry: toDateInput(d.vehicle.insuranceExpiry),
          inspectionExpiry: toDateInput(d.vehicle.inspectionExpiry),
          maintenanceExpiry: toDateInput(d.vehicle.maintenanceExpiry),
          maintenanceKmDue: d.vehicle.maintenanceKmDue || "",
          bolloExpiry: toDateInput(d.vehicle.bolloExpiry),
          notes: d.vehicle.notes || "",
        });
      }
    });
  }
  useEffect(() => { load(); fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || [])); }, [id]);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/vehicles/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Aggiornato");
      setEditing(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function addLog(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/vehicles/${id}/logs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logForm) });
    if (res.ok) { toast.success("Registrazione aggiunta"); setLogOpen(false); setLogForm({ type: "REFUEL", date: new Date().toISOString().slice(0, 10) }); load(); }
    else toast.error("Errore");
  }

  async function remove() {
    if (!confirm(`Eliminare il veicolo ${v.plate}?`)) return;
    await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
    toast.success("Eliminato"); router.push("/admin/vehicles");
  }

  if (!v) return <div className="p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>;

  const insD = daysUntil(v.insuranceExpiry);
  const inspD = daysUntil(v.inspectionExpiry);
  const maintD = daysUntil(v.maintenanceExpiry);

  return (
    <div className="space-y-6">
      <PageHeader title={`${v.plate}`} description={`${v.brand || ""} ${v.model || ""} · ${tr(v.type)}${v.assignedTo ? ` · ${v.assignedTo.name}` : ""}`} back="/admin/vehicles"
        actions={
          <div className="flex gap-2">
            {!editing && <Button variant="outline" onClick={() => setEditing(true)}>Modifica</Button>}
            <Dialog open={logOpen} onOpenChange={setLogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Registra evento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuova registrazione</DialogTitle></DialogHeader>
                <form onSubmit={addLog} className="space-y-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={logForm.type} onChange={e => setLogForm({ ...logForm, type: e.target.value })}>
                      {LOG_TYPES.map(o => <option key={o.v} value={o.v}>{o.icon} {o.l}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data</Label><Input type="date" required value={logForm.date} onChange={e => setLogForm({ ...logForm, date: e.target.value })} /></div>
                    <div><Label>Km veicolo</Label><Input type="number" value={logForm.km || ""} onChange={e => setLogForm({ ...logForm, km: e.target.value })} /></div>
                  </div>
                  <div><Label>Descrizione *</Label><Input required value={logForm.description || ""} onChange={e => setLogForm({ ...logForm, description: e.target.value })} placeholder="Es. Tagliando 30.000km officina XY" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Costo €</Label><Input type="number" step="0.01" value={logForm.cost || ""} onChange={e => setLogForm({ ...logForm, cost: e.target.value })} /></div>
                    <div><Label>Riferimento fattura</Label><Input value={logForm.invoiceRef || ""} onChange={e => setLogForm({ ...logForm, invoiceRef: e.target.value })} /></div>
                  </div>
                  {(logForm.type === "MAINTENANCE" || logForm.type === "INSPECTION" || logForm.type === "INSURANCE_RENEWAL") && (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Prossima scadenza</Label><Input type="date" value={logForm.nextDueDate || ""} onChange={e => setLogForm({ ...logForm, nextDueDate: e.target.value })} /></div>
                      {logForm.type === "MAINTENANCE" && <div><Label>Prossimo km</Label><Input type="number" value={logForm.nextDueKm || ""} onChange={e => setLogForm({ ...logForm, nextDueKm: e.target.value })} /></div>}
                    </div>
                  )}
                  <Button type="submit" className="w-full">Salva</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
          </div>
        } />

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Km attuali</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{v.currentKm.toLocaleString("it-IT")}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Assicurazione</CardTitle></CardHeader><CardContent>
          {v.insuranceExpiry ? <Badge variant={insD! < 0 ? "destructive" : insD! < 60 ? "warning" : "success"}>{formatDate(v.insuranceExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
          {v.insuranceCompany && <div className="text-xs text-muted-foreground mt-1">{v.insuranceCompany}</div>}
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revisione</CardTitle></CardHeader><CardContent>
          {v.inspectionExpiry ? <Badge variant={inspD! < 0 ? "destructive" : inspD! < 60 ? "warning" : "success"}>{formatDate(v.inspectionExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Wrench className="h-4 w-4" /> Tagliando</CardTitle></CardHeader><CardContent>
          {v.maintenanceExpiry ? <Badge variant={maintD! < 0 ? "destructive" : maintD! < 60 ? "warning" : "muted"}>{formatDate(v.maintenanceExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
          {v.maintenanceKmDue && <div className="text-xs text-muted-foreground mt-1">a {v.maintenanceKmDue.toLocaleString("it-IT")} km</div>}
        </CardContent></Card>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle>Modifica dati veicolo</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>Targa</Label><Input value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="VAN">Furgone</option><option value="TRUCK">Camion</option><option value="CAR">Auto</option>
                <option value="ELECTRIC">Elettrico</option><option value="MOTORCYCLE">Moto</option><option value="TRAILER">Rimorchio</option><option value="OTHER">Altro</option>
              </Select>
            </div>
            <div><Label>Marca</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
            <div><Label>Modello</Label><Input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            <div><Label>Km attuali</Label><Input type="number" value={form.currentKm} onChange={e => setForm({ ...form, currentKm: Number(e.target.value) })} /></div>
            <div>
              <Label>Assegnato a</Label>
              <Select value={form.assignedToId} onChange={e => setForm({ ...form, assignedToId: e.target.value })}>
                <option value="">— Nessuno —</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </div>
            <div><Label>Compagnia assicurativa</Label><Input value={form.insuranceCompany} onChange={e => setForm({ ...form, insuranceCompany: e.target.value })} /></div>
            <div><Label>N. polizza</Label><Input value={form.insurancePolicyNo} onChange={e => setForm({ ...form, insurancePolicyNo: e.target.value })} /></div>
            <div><Label>Scad. assicurazione</Label><Input type="date" value={form.insuranceExpiry} onChange={e => setForm({ ...form, insuranceExpiry: e.target.value })} /></div>
            <div><Label>Scad. revisione</Label><Input type="date" value={form.inspectionExpiry} onChange={e => setForm({ ...form, inspectionExpiry: e.target.value })} /></div>
            <div><Label>Scad. tagliando</Label><Input type="date" value={form.maintenanceExpiry} onChange={e => setForm({ ...form, maintenanceExpiry: e.target.value })} /></div>
            <div><Label>Tagliando km</Label><Input type="number" value={form.maintenanceKmDue} onChange={e => setForm({ ...form, maintenanceKmDue: e.target.value })} /></div>
            <div><Label>Scad. bollo</Label><Input type="date" value={form.bolloExpiry} onChange={e => setForm({ ...form, bolloExpiry: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>
              <Button variant="outline" onClick={() => setEditing(false)}>Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Storico registrazioni ({v.logs?.length || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {!v.logs || v.logs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Nessuna registrazione. Inizia con "Registra evento" sopra.</div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-xs uppercase text-muted-foreground"><th className="text-left p-3">Data</th><th className="text-left">Tipo</th><th className="text-left">Descrizione</th><th className="text-right">Km</th><th className="text-right">Costo</th><th>Prossima scadenza</th></tr></thead>
              <tbody>
                {v.logs.map((l: any) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="p-3 text-xs">{formatDate(l.date)}</td>
                    <td><Badge variant="muted">{LOG_TYPES.find(o => o.v === l.type)?.icon} {tr(l.type)}</Badge></td>
                    <td>{l.description}{l.invoiceRef && <div className="text-xs text-muted-foreground">Fattura: {l.invoiceRef}</div>}</td>
                    <td className="text-right text-xs">{l.km ? l.km.toLocaleString("it-IT") : "—"}</td>
                    <td className="text-right text-xs">{l.cost ? formatCurrency(l.cost) : "—"}</td>
                    <td className="text-xs">{l.nextDueDate ? formatDate(l.nextDueDate) : "—"}{l.nextDueKm ? ` / ${l.nextDueKm.toLocaleString("it-IT")} km` : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Attachments entityType="Vehicle" entityId={v.id} title="Documenti veicolo (libretto, assicurazione, fatture)" accept=".pdf,image/*" />
    </div>
  );
}
