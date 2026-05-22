"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileSignature, Loader2, Shield, AlertTriangle, FileCheck, FileText, FileX, FileQuestion, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const CATEGORY_ICON: Record<string, any> = {
  SOPRALLUOGO: FileText, INCARICO: FileSignature, INIZIO_LAVORI: FileText,
  FINE_LAVORI: FileCheck, COLLAUDO: FileCheck, CONSEGNA: FileCheck,
  NON_CONFORMITA: AlertTriangle, MANCATO_ACCESSO: FileX, RIFIUTO: FileX,
  SAL: FileText, GARANZIA: Shield, RELAZIONE_TECNICA: FileText,
  VERIFICA_DPR462: FileCheck, FORMAZIONE: FileText, ALTRO: FileQuestion,
};

function NewDocForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState<1 | 2>(1);
  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedTpl, setSelectedTpl] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<any>({
    templateId: sp.get("templateId") || "",
    customerId: sp.get("customerId") || "",
    plantId: sp.get("plantId") || "",
    workOrderId: sp.get("workOrderId") || "",
    customFields: {},
  });

  useEffect(() => {
    fetch("/api/document-templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);
  useEffect(() => {
    if (form.customerId) fetch(`/api/plants?customerId=${form.customerId}`).then(r => r.json()).then(d => setPlants(d.plants || []));
  }, [form.customerId]);

  function pickTemplate(t: any) {
    setSelectedTpl(t);
    setForm({ ...form, templateId: t.id });
    setStep(2);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { document } = await res.json();
      toast.success("Documento generato");
      router.push(`/admin/documenti/${document.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  // Extract placeholders {{custom.foo}} from template body
  const customKeys = selectedTpl ? Array.from(new Set([...selectedTpl.bodyTemplate.matchAll(/\{\{custom\.([a-zA-Z0-9_]+)\}\}/g)].map(m => m[1]))) : [];

  // Group templates by category
  const grouped = templates.reduce((acc: Record<string, any[]>, t: any) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});

  if (step === 1) {
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <PageHeader title="Nuovo documento" description="1. Seleziona il modello" back="/admin/documenti" />
        {Object.entries(grouped).map(([cat, ts]) => (
          <div key={cat}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.replace(/_/g, " ")}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ts.map((t: any) => {
                const Icon = CATEGORY_ICON[t.category] || FileText;
                return (
                  <button key={t.id} type="button" onClick={() => pickTemplate(t)}
                    className="text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <Badge variant="muted" className="text-[10px]">{t.signerRole}</Badge>
                    </div>
                    <h4 className="font-semibold text-sm">{t.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.description}</p>
                    {t.legalReference && <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-2 italic">{t.legalReference}</p>}
                    <div className="flex justify-end mt-3 pt-2 border-t"><ChevronRight className="h-3 w-3 text-muted-foreground" /></div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo documento" description={`2. Compila ${selectedTpl?.title}`}
        back="/admin/documenti"
        actions={<div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setStep(1)}>← Cambia modello</Button>
          <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Genera</Button>
        </div>} />

      <Card><CardContent className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Cliente</Label>
            <Select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value, plantId: "" })}>
              <option value="">— Nessuno —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`}</option>)}
            </Select>
          </div>
          <div>
            <Label>Impianto</Label>
            <Select value={form.plantId} onChange={e => setForm({ ...form, plantId: e.target.value })}>
              <option value="">—</option>
              {plants.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
        </div>
        <div><Label>Titolo personalizzato (opzionale)</Label><Input placeholder={selectedTpl?.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

        {customKeys.length > 0 && (
          <>
            <div className="text-sm font-semibold pt-2 border-t">Compila i campi del modello</div>
            <div className="grid md:grid-cols-2 gap-3">
              {customKeys.map(k => (
                <div key={k} className={k.length > 12 || /description|details|reason|facts|prescriptions|materials|sizing|workDescription|stateDescription|preexistingIssues|nonConformities|risks|recommendations|exclusions|programDetails|customerReason|companyPosition|witnesses|salTable/i.test(k) ? "md:col-span-2" : ""}>
                  <Label className="capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</Label>
                  {(/description|details|reason|facts|prescriptions|materials|sizing|workDescription|stateDescription|preexistingIssues|nonConformities|risks|recommendations|exclusions|programDetails|customerReason|companyPosition|witnesses|salTable/i.test(k))
                    ? <Textarea rows={3} value={form.customFields[k] || ""} onChange={e => setForm({ ...form, customFields: { ...form.customFields, [k]: e.target.value } })} />
                    : <Input value={form.customFields[k] || ""} onChange={e => setForm({ ...form, customFields: { ...form.customFields, [k]: e.target.value } })} />
                  }
                </div>
              ))}
            </div>
          </>
        )}

        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          Dopo la creazione potrai:
          <ul className="list-disc ml-5 mt-1">
            <li>Stampare il PDF</li>
            <li>Firmare con tablet, OTP via email del cliente o caricare PDF firmato</li>
            <li>Inviare al cliente un link sicuro (senza login) per firma online</li>
          </ul>
        </div>
      </CardContent></Card>
    </form>
  );
}

export default function NewDocPage() { return <Suspense><NewDocForm /></Suspense>; }
