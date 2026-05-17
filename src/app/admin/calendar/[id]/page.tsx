"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { Save, Loader2, Trash2, Edit, X } from "lucide-react";
import { toast } from "sonner";

function toLocalInput(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function CalendarEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(false);

  function load() {
    fetch(`/api/calendar/${id}`).then(r => r.json()).then(d => {
      setEvent(d.event);
      if (d.event) {
        setForm({
          title: d.event.title, description: d.event.description || "",
          type: d.event.type, startsAt: toLocalInput(d.event.startsAt), endsAt: toLocalInput(d.event.endsAt),
          location: d.event.location || "", reminderMinutesBefore: d.event.reminderMinutesBefore, status: d.event.status,
        });
      }
    });
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Appuntamento aggiornato");
      setEditing(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function remove() {
    if (!confirm("Eliminare definitivamente questo appuntamento?")) return;
    const res = await fetch(`/api/calendar/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminato"); router.push("/admin/calendar"); }
  }

  if (!event) return <div className="p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title={event.title} description={`${t(event.type)} · proprietario ${event.owner.name}`} back="/admin/calendar"
        actions={
          <div className="flex gap-2">
            {!editing && <Button variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /> Modifica</Button>}
            <Button variant="destructive" onClick={remove}><Trash2 className="h-4 w-4" /> Elimina</Button>
          </div>
        } />

      <Card>
        <CardHeader><CardTitle>{editing ? "Modifica appuntamento" : "Dettagli"}</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {editing ? (
            <>
              <div className="md:col-span-2"><Label>Titolo *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div>
                <Label>Tipo</Label>
                <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="MEETING">Riunione</option><option value="CALL">Chiamata</option><option value="TASK">Attivita</option>
                  <option value="INSPECTION">Sopralluogo</option><option value="DEADLINE">Scadenza</option><option value="REMINDER">Promemoria</option>
                </Select>
              </div>
              <div>
                <Label>Stato</Label>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option value="CONFIRMED">Confermato</option><option value="TENTATIVE">Provvisorio</option><option value="CANCELLED">Annullato</option>
                </Select>
              </div>
              <div><Label>Inizio</Label><Input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><Label>Fine</Label><Input type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Luogo</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div><Label>Promemoria (min prima)</Label><Input type="number" min="0" value={form.reminderMinutesBefore} onChange={e => setForm({ ...form, reminderMinutesBefore: Number(e.target.value) })} /></div>
              <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="md:col-span-2 flex gap-2">
                <Button onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>
                <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Annulla</Button>
              </div>
            </>
          ) : (
            <>
              <div><strong>Tipo:</strong> <Badge>{t(event.type)}</Badge></div>
              <div><strong>Stato:</strong> <Badge variant={event.status === "CONFIRMED" ? "success" : event.status === "CANCELLED" ? "destructive" : "muted"}>{event.status === "CONFIRMED" ? "Confermato" : event.status === "CANCELLED" ? "Annullato" : "Provvisorio"}</Badge></div>
              <div><strong>Inizio:</strong> {formatDateTime(event.startsAt)}</div>
              <div><strong>Fine:</strong> {formatDateTime(event.endsAt)}</div>
              {event.location && <div className="md:col-span-2"><strong>Luogo:</strong> {event.location}</div>}
              <div><strong>Promemoria:</strong> {event.reminderMinutesBefore} min prima {event.reminderEmailSent ? "✓ inviato" : ""}</div>
              {event.description && <div className="md:col-span-2 pt-2 border-t"><strong>Descrizione:</strong><br/>{event.description}</div>}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
