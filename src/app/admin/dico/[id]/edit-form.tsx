"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DICO_CHECKLIST = [
  { id: "project", label: "Progetto firmato dal RT" },
  { id: "materials", label: "Relazione materiali utilizzati" },
  { id: "scheme", label: "Schema impianto realizzato" },
  { id: "conformity", label: "Dichiarazioni conformita prodotti" },
  { id: "visura", label: "Visura camerale ditta" },
  { id: "training", label: "Attestati PES/PAV/PEI" },
  { id: "earth", label: "Verifica messa a terra" },
  { id: "differential", label: "Prova differenziali" },
  { id: "insulation", label: "Misura resistenza isolamento" },
];

export function DicoEditForm({ dico }: { dico: any }) {
  const router = useRouter();
  const [form, setForm] = useState<any>({
    rtName: dico.rtName || "",
    rtRegistrationNo: dico.rtRegistrationNo || "",
    issueDate: dico.issueDate ? new Date(dico.issueDate).toISOString().slice(0, 10) : "",
    sentToInailAt: dico.sentToInailAt ? new Date(dico.sentToInailAt).toISOString().slice(0, 10) : "",
    inailReceipt: dico.inailReceipt || "",
    status: dico.status,
    notes: dico.notes || "",
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(DICO_CHECKLIST.map(c => [c.id, dico.checklistJson?.[c.id] || false]))
  );
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dico/${dico.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          issueDate: form.issueDate || null,
          sentToInailAt: form.sentToInailAt || null,
          checklistJson: checklist,
        }),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("DICO aggiornata");
      router.push(`/admin/dico/${dico.id}`);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  const completedCount = Object.values(checklist).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Modifica DICO {dico.number}</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Stato</Label>
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="DRAFT">Bozza</option>
              <option value="COMPLETE">Completa</option>
              <option value="ISSUED">Emessa</option>
              <option value="SENT_TO_INAIL">Inviata INAIL</option>
              <option value="ARCHIVED">Archiviata</option>
            </Select>
          </div>
          <div><Label>Data emissione</Label><Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
          <div><Label>Responsabile Tecnico</Label><Input value={form.rtName} onChange={e => setForm({ ...form, rtName: e.target.value })} /></div>
          <div><Label>Iscrizione CCIAA</Label><Input value={form.rtRegistrationNo} onChange={e => setForm({ ...form, rtRegistrationNo: e.target.value })} /></div>
          <div><Label>Data invio INAIL</Label><Input type="date" value={form.sentToInailAt} onChange={e => setForm({ ...form, sentToInailAt: e.target.value })} /></div>
          <div><Label>Protocollo INAIL</Label><Input value={form.inailReceipt} onChange={e => setForm({ ...form, inailReceipt: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Note</Label><Textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center justify-between">Checklist conformita ({completedCount}/{DICO_CHECKLIST.length})</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {DICO_CHECKLIST.map(item => (
              <li key={item.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                <input type="checkbox" id={`e-${item.id}`} checked={checklist[item.id] || false}
                  onChange={e => setChecklist({ ...checklist, [item.id]: e.target.checked })} />
                <label htmlFor={`e-${item.id}`} className="text-sm cursor-pointer flex-1">
                  {checklist[item.id] && <CheckCircle2 className="h-4 w-4 text-emerald-500 inline mr-1" />}
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva modifiche</Button>
        <Button variant="outline" onClick={() => router.push(`/admin/dico/${dico.id}`)}><X className="h-4 w-4" /> Annulla</Button>
      </div>
    </div>
  );
}
