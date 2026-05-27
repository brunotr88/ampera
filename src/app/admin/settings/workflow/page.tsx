"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, GripVertical, Mail } from "lucide-react";
import { toast } from "sonner";

const SCOPES = [
  { v: "WORKORDER", l: "Interventi" },
  { v: "PROJECT", l: "Commesse" },
  { v: "REPORT", l: "Rapportini" },
];

export default function WorkflowSettingsPage() {
  const [states, setStates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("WORKORDER");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({ scope: "WORKORDER", color: "#3B82F6", percentage: 0, sortOrder: 100, isActive: true, triggersClientEmail: false });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/workflow-states");
    const d = await r.json();
    setStates(d.states || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function startNew() {
    setEditing(null);
    setForm({ scope, color: "#3B82F6", percentage: 0, sortOrder: (states.filter(s => s.scope === scope).length + 1) * 10, isActive: true, triggersClientEmail: false });
    setOpen(true);
  }
  function startEdit(s: any) {
    setEditing(s);
    setForm({ ...s });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.scope) { toast.error("Nome e scope richiesti"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/workflow-states/${editing.id}` : "/api/workflow-states";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success(editing ? "Stato aggiornato" : "Stato creato");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function remove(s: any) {
    if (!confirm(`Eliminare lo stato "${s.name}"?`)) return;
    const res = await fetch(`/api/workflow-states/${s.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminato"); load(); }
    else toast.error((await res.json()).error || "Errore");
  }

  const filtered = states.filter(s => s.scope === scope).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Stati workflow" description="Personalizza gli stati di interventi, commesse e rapportini. Triggera email automatiche al cliente." back="/admin/settings"
        actions={<Button onClick={startNew}><Plus className="h-4 w-4" /> Nuovo stato</Button>}
      />

      <div className="flex gap-2 border-b border-border">
        {SCOPES.map(sc => (
          <button key={sc.v} onClick={() => setScope(sc.v)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              scope === sc.v ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {sc.l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin inline" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nessuno stato per questo scope. Crea il primo.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filtered.map(s => (
                <li key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="h-8 w-8 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: s.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.name}</span>
                      <Badge variant="muted" className="text-[10px]">{s.percentage}%</Badge>
                      {s.isFinal && <Badge variant="success" className="text-[10px]">Finale</Badge>}
                      {!s.isActive && <Badge variant="destructive" className="text-[10px]">Disattivato</Badge>}
                      {s.triggersClientEmail && <Badge variant="info" className="text-[10px]"><Mail className="h-2 w-2 mr-1" /> Email</Badge>}
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(s)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing ? "Modifica stato" : "Nuovo stato workflow"}</DialogTitle></DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Scope *</Label>
                <Select value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} disabled={!!editing}>
                  {SCOPES.map(sc => <option key={sc.v} value={sc.v}>{sc.l}</option>)}
                </Select>
              </div>
              <div>
                <Label>Sort order</Label>
                <Input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div><Label>Nome stato *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Es: Sopralluogo programmato" /></div>
            <div><Label>Descrizione</Label><Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Colore</Label>
                <div className="flex gap-2 items-center">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-10 w-12 rounded border border-input" />
                  <Input value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="font-mono text-xs" />
                </div>
              </div>
              <div><Label>% completamento</Label><Input type="number" min="0" max="100" value={form.percentage} onChange={e => setForm({ ...form, percentage: Number(e.target.value) })} /></div>
              <div><Label>Icon (lucide)</Label><Input value={form.icon || ""} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="wrench" /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.isFinal} onChange={e => setForm({ ...form, isFinal: e.target.checked })} />
                Stato finale (chiude workflow)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                Attivo (selezionabile)
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={!!form.triggersClientEmail} onChange={e => setForm({ ...form, triggersClientEmail: e.target.checked })} />
                <Mail className="h-3 w-3" /> Invia email al cliente al passaggio in questo stato
              </label>
            </div>

            {form.triggersClientEmail && (
              <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
                <div>
                  <Label>Oggetto email</Label>
                  <Input value={form.emailSubject || ""} onChange={e => setForm({ ...form, emailSubject: e.target.value })} placeholder="Aggiornamento intervento {{workOrder.code}}" />
                </div>
                <div>
                  <Label>Corpo email (HTML, supporta placeholders)</Label>
                  <Textarea rows={6} value={form.emailBodyHtml || ""} onChange={e => setForm({ ...form, emailBodyHtml: e.target.value })} className="font-mono text-xs"
                    placeholder="<p>Gentile {{customer.name}}, il tuo intervento {{workOrder.code}} è ora in stato &quot;{{state.name}}&quot;.</p><p>Segui lo stato: <a href='{{trackingUrl}}'>{{trackingUrl}}</a></p>" />
                  <p className="text-xs text-muted-foreground mt-1">Placeholders: {`{{customer.name}}, {{workOrder.code}}, {{state.name}}, {{trackingUrl}}, {{tenant.name}}`}</p>
                </div>
              </div>
            )}

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Salva modifiche" : "Crea stato"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
