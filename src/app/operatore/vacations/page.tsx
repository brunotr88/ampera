"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_LABEL: any = { VACATION: "Ferie", PERMIT: "Permesso", ILLNESS: "Malattia", TRAINING: "Formazione", LEAVE_104: "L.104", PARENTAL: "Genitoriale", OTHER: "Altro" };

export default function OperatoreVacations() {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: "VACATION", notifyDaysBefore: 7 });
  const [loading, setLoading] = useState(false);

  function load() { fetch("/api/vacations?mine=1").then(r => r.json()).then(d => setItems(d.requests || [])); }
  useEffect(load, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/vacations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { toast.success("Richiesta inviata"); setOpen(false); setForm({ type: "VACATION", notifyDaysBefore: 7 }); load(); }
    else toast.error("Errore");
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link href="/operatore/me" className="text-slate-500"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-xl font-bold">Ferie & Permessi</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="icon"><Plus className="h-4 w-4" /></Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuova richiesta</DialogTitle></DialogHeader>
            <form onSubmit={send} className="space-y-3">
              <div><Label>Tipo</Label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(TYPE_LABEL).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}</Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Dal</Label><Input type="date" required value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
                <div><Label>Al</Label><Input type="date" required value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
              </div>
              <div><Label>Motivo</Label><Textarea rows={2} value={form.reason || ""} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="px-5 space-y-2">
        {items.length === 0 ? <p className="text-center text-slate-500 py-10">Nessuna richiesta.</p> :
          items.map(v => (
            <div key={v.id} className="bg-white rounded-xl p-4 border">
              <div className="flex justify-between items-center">
                <span className="font-medium">{TYPE_LABEL[v.type]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${v.status === "APPROVED" ? "bg-emerald-100 text-emerald-700" : v.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{v.status}</span>
              </div>
              <div className="text-sm text-slate-600">{formatDate(v.startDate)} → {formatDate(v.endDate)}</div>
              {v.reason && <div className="text-xs text-slate-500 mt-1">{v.reason}</div>}
            </div>
          ))}
      </div>
    </div>
  );
}
