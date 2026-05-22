"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const DICO_CHECKLIST = [
  { id: "project", label: "Progetto firmato dal RT (se obbligatorio per tipologia)" },
  { id: "materials", label: "Relazione dei materiali utilizzati" },
  { id: "scheme", label: "Schema dell'impianto realizzato" },
  { id: "conformity", label: "Riferimento dichiarazioni di conformità prodotti utilizzati" },
  { id: "visura", label: "Copia visura camerale ditta installatrice" },
  { id: "training", label: "Attestati formazione PES/PAV/PEI operatori (CEI 11-27)" },
  { id: "earth", label: "Verifica messa a terra (CEI 64-8)" },
  { id: "differential", label: "Prova differenziali (test pulsante)" },
  { id: "insulation", label: "Misura resistenza isolamento" },
];

function NewDicoForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [plants, setPlants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    plantId: sp.get("plantId") || "",
    rtName: "",
    rtRegistrationNo: "",
    issueDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(DICO_CHECKLIST.map(c => [c.id, false]))
  );

  useEffect(() => { fetch("/api/plants").then(r => r.json()).then(d => setPlants(d.plants || [])); }, []);

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const isComplete = completedCount === DICO_CHECKLIST.length;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/dico", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, checklist }),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("DICO creata");
      router.push("/admin/dico");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuova DICO" description="Dichiarazione di Conformità DM 37/08" back="/admin/dico"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea</Button>} />

      <Card>
        <CardHeader><CardTitle>Dati DICO</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Impianto *</Label>
            <Select required value={form.plantId} onChange={e => setForm({ ...form, plantId: e.target.value })}>
              <option value="">— Seleziona impianto —</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name} ({p.customer?.companyName || p.customer?.name})</option>)}
            </Select>
          </div>
          <div><Label>Responsabile Tecnico (nome) *</Label><Input required value={form.rtName} onChange={e => setForm({ ...form, rtName: e.target.value })} placeholder="Es. Mario Rossi" /></div>
          <div><Label>N. iscrizione CCIAA</Label><Input value={form.rtRegistrationNo} onChange={e => setForm({ ...form, rtRegistrationNo: e.target.value })} placeholder="REA TV-123456" /></div>
          <div><Label>Data emissione</Label><Input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Note</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Note interne sulla DICO" /></div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Checklist conformità DM 37/08</span>
            <span className={`text-sm font-normal ${isComplete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {completedCount}/{DICO_CHECKLIST.length} {isComplete ? "✓ COMPLETA" : "incompleta"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Spunta tutti gli elementi obbligatori per evitare DICO incomplete. La compilazione è tracciata e visibile in audit log.</p>
          <ul className="space-y-2">
            {DICO_CHECKLIST.map(item => (
              <li key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent">
                <input
                  type="checkbox"
                  id={item.id}
                  checked={checklist[item.id] || false}
                  onChange={e => setChecklist({ ...checklist, [item.id]: e.target.checked })}
                  className="mt-0.5"
                />
                <label htmlFor={item.id} className="text-sm cursor-pointer flex-1 flex items-center gap-2">
                  {checklist[item.id] && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </form>
  );
}

export default function NewDicoPage() { return <Suspense><NewDicoForm /></Suspense>; }
