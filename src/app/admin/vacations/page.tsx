"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import { Plus, Check, X, Sun, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: any = { VACATION: "Ferie", PERMIT: "Permesso", ILLNESS: "Malattia", TRAINING: "Formazione", LEAVE_104: "L. 104", PARENTAL: "Genitoriale", OTHER: "Altro" };

export default function VacationsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type: "VACATION", userId: "", notifyDaysBefore: 7 });

  function load() { fetch("/api/vacations").then(r => r.json()).then(d => setRequests(d.requests || [])); }
  useEffect(() => { load(); fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || [])); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vacations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Errore");
      toast.success("Richiesta inviata");
      setOpen(false); setForm({ type: "VACATION", userId: "", notifyDaysBefore: 7 }); load();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function act(id: string, action: "approve" | "reject") {
    const reason = action === "reject" ? prompt("Motivo del rifiuto:") : undefined;
    const res = await fetch("/api/vacations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, reason }) });
    if (res.ok) { toast.success(action === "approve" ? "Approvata" : "Respinta"); load(); }
    else toast.error("Errore");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ferie & Permessi" description={`${requests.length} richieste registrate`} actions={
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
                  {Object.entries(TYPE_LABEL).map(([k, v]: any) => <option key={k} value={k}>{v}</option>)}
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
      } />

      <Table>
        <TableHeader><TableRow><TableHead>Utente</TableHead><TableHead>Tipo</TableHead><TableHead>Periodo</TableHead><TableHead>Stato</TableHead><TableHead>Motivo</TableHead><TableHead></TableHead></TableRow></TableHeader>
        <TableBody>
          {requests.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground"><Sun className="h-7 w-7 mx-auto mb-2" />Nessuna richiesta</TableCell></TableRow> : requests.map(v => (
            <TableRow key={v.id}>
              <TableCell>{v.user.name}</TableCell>
              <TableCell><Badge variant="outline">{TYPE_LABEL[v.type]}</Badge></TableCell>
              <TableCell>{formatDate(v.startDate)} → {formatDate(v.endDate)}</TableCell>
              <TableCell>
                <Badge variant={v.status === "APPROVED" ? "success" : v.status === "PENDING" ? "warning" : "destructive"}>{v.status}</Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{v.reason || v.rejectedReason || "—"}</TableCell>
              <TableCell className="text-right">
                {v.status === "PENDING" && (
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => act(v.id, "approve")}><Check className="h-3 w-3" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => act(v.id, "reject")}><X className="h-3 w-3" /></Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
