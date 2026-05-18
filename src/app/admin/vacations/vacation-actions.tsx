"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<string, string> = { VACATION: "Ferie", PERMIT: "Permesso", ILLNESS: "Malattia", TRAINING: "Formazione", LEAVE_104: "L. 104", PARENTAL: "Genitoriale", OTHER: "Altro" };

export function NewVacationDialog({ users }: { users: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type: "VACATION", userId: "", notifyDaysBefore: 7 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vacations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Richiesta inviata");
      setOpen(false);
      setForm({ type: "VACATION", userId: "", notifyDaysBefore: 7 });
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Nuova richiesta</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nuova richiesta ferie/permesso</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Utente *</Label><Select required value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}>
            <option value="">— Seleziona —</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select></div>
            <div><Label>Notifica giorni prima</Label><Input type="number" min="0" value={form.notifyDaysBefore} onChange={e => setForm({ ...form, notifyDaysBefore: Number(e.target.value) })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Dal *</Label><Input type="date" required value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
            <div><Label>Al *</Label><Input type="date" required value={form.endDate || ""} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          </div>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.halfDayStart} onChange={e => setForm({ ...form, halfDayStart: e.target.checked })} /> Mezza giornata inizio</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.halfDayEnd} onChange={e => setForm({ ...form, halfDayEnd: e.target.checked })} /> Mezza giornata fine</label>
          </div>
          <div><Label>Motivo</Label><Textarea rows={2} value={form.reason || ""} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invia"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function VacationRowActions({ id }: { id: string }) {
  const router = useRouter();

  async function act(action: "approve" | "reject") {
    const reason = action === "reject" ? prompt("Motivo del rifiuto:") : undefined;
    const res = await fetch("/api/vacations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) });
    if (res.ok) {
      toast.success(action === "approve" ? "Approvata" : "Respinta");
      router.refresh();
    } else {
      toast.error("Errore");
    }
  }

  return (
    <div className="flex gap-1 justify-end">
      <Button size="sm" variant="outline" onClick={() => act("approve")}><Check className="h-3 w-3" /></Button>
      <Button size="sm" variant="destructive" onClick={() => act("reject")}><X className="h-3 w-3" /></Button>
    </div>
  );
}
