"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate, formatDateTime } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

function monthGrid(d: Date) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const startDay = (start.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() - startDay + i);
    days.push(day);
  }
  return days;
}

export default function CalendarPage() {
  const [cur, setCur] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ title: "", type: "MEETING", reminderMinutesBefore: 60 });

  function load() {
    const from = new Date(cur.getFullYear(), cur.getMonth(), -7);
    const to = new Date(cur.getFullYear(), cur.getMonth() + 1, 7);
    fetch(`/api/calendar?from=${from.toISOString()}&to=${to.toISOString()}`).then(r => r.json()).then(d => setEvents(d.events || []));
  }
  useEffect(load, [cur]);

  const grid = monthGrid(cur);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Appuntamento creato");
      setOpen(false); setForm({ title: "", type: "MEETING", reminderMinutesBefore: 60 }); load();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  const eventsByDay: Record<string, any[]> = {};
  for (const e of events) {
    const k = new Date(e.startsAt).toISOString().slice(0, 10);
    (eventsByDay[k] = eventsByDay[k] || []).push(e);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Calendario" description={cur.toLocaleString("it-IT", { month: "long", year: "numeric" })} actions={
        <div className="flex gap-2 items-center">
          <Button size="sm" variant="outline" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="sm" variant="outline" onClick={() => setCur(new Date())}>Oggi</Button>
          <Button size="sm" variant="outline" onClick={() => setCur(new Date(cur.getFullYear(), cur.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Appuntamento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuovo appuntamento</DialogTitle></DialogHeader>
              <form onSubmit={save} className="space-y-3">
                <div><Label>Titolo *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Tipo</Label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="MEETING">Riunione</option><option value="CALL">Chiamata</option><option value="TASK">Attività</option>
                    <option value="INSPECTION">Sopralluogo</option><option value="DEADLINE">Scadenza</option><option value="REMINDER">Promemoria</option>
                  </Select></div>
                  <div><Label>Promemoria (min prima)</Label><Input type="number" min="0" value={form.reminderMinutesBefore} onChange={e => setForm({ ...form, reminderMinutesBefore: Number(e.target.value) })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Inizio *</Label><Input type="datetime-local" required value={form.startsAt || ""} onChange={e => setForm({ ...form, startsAt: e.target.value })} /></div>
                  <div><Label>Fine *</Label><Input type="datetime-local" required value={form.endsAt || ""} onChange={e => setForm({ ...form, endsAt: e.target.value })} /></div>
                </div>
                <div><Label>Luogo</Label><Input value={form.location || ""} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                <div><Label>Descrizione</Label><Textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crea"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      } />

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b">
            {["Lun","Mar","Mer","Gio","Ven","Sab","Dom"].map(d => <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d, i) => {
              const key = d.toISOString().slice(0, 10);
              const evs = eventsByDay[key] || [];
              const inMonth = d.getMonth() === cur.getMonth();
              const today = d.toDateString() === new Date().toDateString();
              return (
                <div key={i} className={`min-h-[110px] p-2 border-b border-r text-xs ${inMonth ? "" : "bg-muted/30 text-muted-foreground"} ${today ? "ring-2 ring-primary ring-inset" : ""}`}>
                  <div className={`font-semibold mb-1 ${today ? "text-primary" : ""}`}>{d.getDate()}</div>
                  {evs.slice(0, 3).map(e => (
                    <div key={e.id} className="bg-primary/10 text-primary rounded px-1.5 py-0.5 mb-0.5 truncate">{formatDateTime(e.startsAt).slice(11, 16)} {e.title}</div>
                  ))}
                  {evs.length > 3 && <div className="text-muted-foreground">+{evs.length - 3}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="font-display font-bold mb-3">Prossimi 14 giorni</h2>
        <Card>
          <CardContent className="p-0">
            {events.filter(e => new Date(e.startsAt) >= new Date()).slice(0, 20).map(e => (
              <div key={e.id} className="p-3 border-b last:border-0 flex items-center gap-3">
                <div className="w-1 h-12 bg-primary rounded" />
                <div className="flex-1">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">{formatDateTime(e.startsAt)} → {formatDateTime(e.endsAt)} {e.location && `· ${e.location}`}</div>
                </div>
                <Badge variant="outline">{e.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
