"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { UserPlus, Mail, Phone, Smartphone, Pencil, Trash2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Contact = {
  id: string;
  customerId: string | null;
  plantId: string | null;
  name: string;
  surname?: string | null;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  isPrimary: boolean;
  notes?: string | null;
};

type Props = {
  customerId?: string;
  plantId?: string;
  title?: string;
};

export function ContactsManager({ customerId, plantId, title = "Referenti in loco" }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<Partial<Contact>>({ name: "" });

  const ctx = customerId ? `customerId=${customerId}` : `plantId=${plantId}`;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts?${ctx}`);
      const d = await res.json();
      setContacts(d.contacts || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [customerId, plantId]);

  function startNew() {
    setEditing(null);
    setForm({ name: "" });
    setOpen(true);
  }
  function startEdit(c: Contact) {
    setEditing(c);
    setForm({ ...c });
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) { toast.error("Nome richiesto"); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/contacts/${editing.id}` : "/api/contacts";
      const method = editing ? "PATCH" : "POST";
      const body = editing ? form : { ...form, customerId, plantId };
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success(editing ? "Referente aggiornato" : "Referente creato");
      setOpen(false);
      await load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function remove(c: Contact) {
    if (!confirm(`Eliminare il referente "${c.name}"?`)) return;
    const res = await fetch(`/api/contacts/${c.id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminato"); await load(); }
    else toast.error("Errore");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title} ({contacts.length})</span>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={startNew}><UserPlus className="h-4 w-4" /> Aggiungi</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Modifica referente" : "Nuovo referente"}</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Cognome</Label><Input value={form.surname || ""} onChange={e => setForm({ ...form, surname: e.target.value })} /></div>
                </div>
                <div><Label>Ruolo</Label><Input value={form.role || ""} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Direttore tecnico, responsabile manutenzione…" /></div>
                <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Telefono</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                  <div><Label>Cellulare</Label><Input value={form.mobile || ""} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
                </div>
                <div><Label>Note</Label><Input value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={!!form.isPrimary} onChange={e => setForm({ ...form, isPrimary: e.target.checked })} />
                  Referente principale
                </label>
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} {editing ? "Salva modifiche" : "Crea referente"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-4"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun referente in loco. Aggiungi i contatti delle persone presenti sul posto per facilitare le comunicazioni durante interventi e rapportini.</p>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map(c => (
              <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name} {c.surname || ""}</span>
                    {c.isPrimary && <Badge variant="default" className="text-[10px]"><Star className="h-3 w-3" /> Principale</Badge>}
                    {c.role && <Badge variant="muted" className="text-[10px]">{c.role}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-foreground"><Mail className="h-3 w-3" /> {c.email}</a>}
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" /> {c.phone}</a>}
                    {c.mobile && <a href={`tel:${c.mobile}`} className="flex items-center gap-1 hover:text-foreground"><Smartphone className="h-3 w-3" /> {c.mobile}</a>}
                  </div>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1">{c.notes}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" onClick={() => startEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="destructive" size="sm" onClick={() => remove(c)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
