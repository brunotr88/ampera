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
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/labels";
import { Save, Loader2, Users, Building2, User, Search, X, CheckCircle2, Shield, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type SubjectType = "customer" | "supplier" | "user" | "manual";

function NewPrivacyForm() {
  const router = useRouter();
  const sp = useSearchParams();

  // Subject picker
  const [subjectType, setSubjectType] = useState<SubjectType>((sp.get("subjectType") as SubjectType) || "customer");
  const [subjectId, setSubjectId] = useState(sp.get("subjectId") || "");
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectResults, setSubjectResults] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

  // Template + form
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(sp.get("type") || "");
  const [form, setForm] = useState<any>({
    subject: {}, version: "1.0", customFields: {}, expiresAt: "",
  });
  const [autoFilled, setAutoFilled] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Load templates
  useEffect(() => {
    fetch("/api/privacy").then(r => r.json()).then(d => setTemplates(d.templates || []));
  }, []);

  // Search subjects
  useEffect(() => {
    if (subjectType === "manual") return;
    if (subjectSearch.length < 2 && !subjectId) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        let url = "";
        if (subjectType === "customer") url = `/api/customers?q=${encodeURIComponent(subjectSearch)}`;
        else if (subjectType === "supplier") url = `/api/suppliers`;
        else if (subjectType === "user") url = `/api/users`;
        const r = await fetch(url, { signal: ctrl.signal });
        const data = await r.json();
        const items = data.customers || data.suppliers || data.users || [];
        setSubjectResults(items.filter((i: any) => {
          if (subjectType === "supplier" || subjectType === "user") {
            const txt = (i.name + " " + (i.email || "")).toLowerCase();
            return txt.includes(subjectSearch.toLowerCase());
          }
          return true;
        }).slice(0, 8));
      } catch {}
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [subjectSearch, subjectType, subjectId]);

  // Auto-load if pre-set subjectId from URL
  useEffect(() => {
    if (subjectId && subjectType !== "manual") {
      fetch(`/api/privacy/autofill?subjectType=${subjectType}&subjectId=${subjectId}`).then(r => r.json()).then(d => {
        if (d.subject) {
          setSelectedSubject({ id: subjectId, ...d.subject });
          setAutoFilled(d.subject);
          setForm((f: any) => ({ ...f, subject: d.subject }));
        }
      });
    }
  }, []);

  function pickSubject(item: any) {
    const subjectIdLocal = item.id;
    setSubjectId(subjectIdLocal);
    setSelectedSubject(item);
    setSubjectResults([]);
    setSubjectSearch(item.companyName || `${item.name || ""} ${item.surname || ""}`.trim() || item.email);
    fetch(`/api/privacy/autofill?subjectType=${subjectType}&subjectId=${subjectIdLocal}`).then(r => r.json()).then(d => {
      if (d.subject) {
        setAutoFilled(d.subject);
        setForm((f: any) => ({ ...f, subject: d.subject }));
      }
    });
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return toast.error("Seleziona un modello");
    if (subjectType !== "manual" && !subjectId) return toast.error("Seleziona un soggetto");

    setLoading(true);
    try {
      const payload: any = {
        type: selectedTemplate,
        subject: form.subject,
        version: form.version,
        customFields: form.customFields,
        notes: form.notes,
        expiresAt: form.expiresAt || null,
      };
      if (subjectType === "customer") payload.customerId = subjectId;
      else if (subjectType === "supplier") payload.supplierId = subjectId;
      else if (subjectType === "user") payload.userId = subjectId;

      const res = await fetch("/api/privacy", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { document } = await res.json();
      toast.success("Documento generato");
      router.push(`/admin/privacy/${document.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  // Filter templates by audience based on subject type
  const recommendedTypes: string[] = subjectType === "customer" ? ["CUSTOMER_INFORMATIVE", "CUSTOMER_CONSENT", "MARKETING_CONSENT"]
    : subjectType === "supplier" ? ["CONTRACTOR_NDA", "DATA_PROCESSING_AGREEMENT"]
    : subjectType === "user" ? ["EMPLOYEE_INFORMATIVE", "EMPLOYEE_CONSENT", "GEO_TRACKING_CONSENT"]
    : [];
  const filteredTemplates = recommendedTypes.length > 0
    ? [...templates.filter(t => recommendedTypes.includes(t.type)), ...templates.filter(t => !recommendedTypes.includes(t.type))]
    : templates;

  return (
    <form onSubmit={generate} className="max-w-4xl mx-auto space-y-6">
      <PageHeader title="Nuovo documento privacy" back="/admin/privacy"
        actions={<Button type="submit" disabled={loading || !selectedTemplate}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Genera documento</Button>} />

      <Card>
        <CardHeader><CardTitle className="text-base">1. Per chi è il documento?</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { v: "customer", l: "Cliente", icon: Users, color: "text-emerald-600" },
              { v: "supplier", l: "Fornitore", icon: Building2, color: "text-amber-600" },
              { v: "user", l: "Operatore", icon: User, color: "text-sky-600" },
              { v: "manual", l: "Manuale", icon: Shield, color: "text-purple-600" },
            ].map(o => {
              const Icon = o.icon;
              return (
                <button key={o.v} type="button"
                  onClick={() => { setSubjectType(o.v as SubjectType); setSubjectId(""); setSelectedSubject(null); setAutoFilled(null); setForm({ ...form, subject: {} }); }}
                  className={`p-4 rounded-xl border text-sm font-medium transition-colors ${subjectType === o.v ? "border-primary bg-primary/5" : "bg-card hover:bg-accent"}`}>
                  <Icon className={`h-5 w-5 mx-auto mb-2 ${o.color}`} />
                  {o.l}
                </button>
              );
            })}
          </div>

          {subjectType !== "manual" && !selectedSubject && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10"
                placeholder={subjectType === "customer" ? "Cerca cliente per nome, P.IVA, email…" : subjectType === "supplier" ? "Cerca fornitore…" : "Cerca operatore/dipendente…"}
                value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} />
              {subjectResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-popover border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
                  {subjectResults.map(item => (
                    <button key={item.id} type="button" onClick={() => pickSubject(item)}
                      className="w-full text-left p-3 hover:bg-accent border-b last:border-0">
                      <div className="font-medium text-sm">{item.companyName || `${item.name || ""} ${item.surname || ""}`.trim() || item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.email || item.vatNumber || item.role || "—"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedSubject && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{selectedSubject.companyName || `${selectedSubject.name || ""} ${selectedSubject.surname || ""}`.trim()}</div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    {selectedSubject.email && <span>{selectedSubject.email}</span>}
                    {selectedSubject.vatNumber && <span>P.IVA {selectedSubject.vatNumber}</span>}
                    {selectedSubject.fiscalCode && <span>CF {selectedSubject.fiscalCode}</span>}
                    {selectedSubject.role && <span>{t(selectedSubject.role)}</span>}
                  </div>
                  {autoFilled && <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-300">✓ Dati auto-compilati pronti per il documento</div>}
                </div>
                <button type="button" onClick={() => { setSubjectId(""); setSelectedSubject(null); setAutoFilled(null); setSubjectSearch(""); }} className="text-muted-foreground"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {subjectType === "manual" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nome</Label><Input value={form.subject.name || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, name: e.target.value } })} /></div>
                <div><Label>Cognome</Label><Input value={form.subject.surname || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, surname: e.target.value } })} /></div>
                <div><Label>Ragione sociale (se azienda)</Label><Input value={form.subject.companyName || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, companyName: e.target.value } })} /></div>
                <div><Label>P.IVA</Label><Input value={form.subject.vatNumber || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, vatNumber: e.target.value } })} /></div>
                <div><Label>Codice fiscale</Label><Input value={form.subject.fiscalCode || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, fiscalCode: e.target.value } })} maxLength={16} /></div>
                <div><Label>Email</Label><Input type="email" value={form.subject.email || ""} onChange={e => setForm({ ...form, subject: { ...form.subject, email: e.target.value } })} /></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {(selectedSubject || subjectType === "manual") && (
        <Card>
          <CardHeader><CardTitle className="text-base">2. Quale documento generare?</CardTitle></CardHeader>
          <CardContent>
            {recommendedTypes.length > 0 && (
              <div className="mb-3 text-xs text-muted-foreground">⭐ Consigliati per {subjectType === "customer" ? "cliente" : subjectType === "supplier" ? "fornitore" : "operatore"}</div>
            )}
            <div className="grid md:grid-cols-2 gap-3">
              {filteredTemplates.map(tpl => {
                const isRecommended = recommendedTypes.includes(tpl.type);
                return (
                  <label key={tpl.type}
                    className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedTemplate === tpl.type ? "border-primary bg-primary/5" : "hover:bg-accent"} ${isRecommended && selectedTemplate !== tpl.type ? "border-amber-300 dark:border-amber-800" : ""}`}>
                    <input type="radio" name="template" value={tpl.type} checked={selectedTemplate === tpl.type} onChange={() => setSelectedTemplate(tpl.type)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{tpl.title}</span>
                        {isRecommended && <Badge variant="warning" className="text-[10px]">consigliato</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{tpl.description}</div>
                      <div className="flex items-center gap-2 mt-2 text-[10px]">
                        <Badge variant="muted">{t(tpl.audience)}</Badge>
                        {tpl.consentRequired && <Badge variant="info">richiede firma</Badge>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTemplate && (
        <Card>
          <CardHeader><CardTitle className="text-base">3. Opzioni aggiuntive (opzionale)</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>Versione documento</Label><Input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} placeholder="1.0" /></div>
            <div><Label>Scadenza (opzionale)</Label><Input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Email DPO</Label><Input type="email" value={form.dpoEmail || ""} onChange={e => setForm({ ...form, dpoEmail: e.target.value })} placeholder="dpo@azienda.it (se nominato)" /></div>
            <div className="md:col-span-2"><Label>Note interne</Label><Textarea rows={2} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Note non visibili nel documento" /></div>
          </CardContent>
        </Card>
      )}
    </form>
  );
}

export default function NewPrivacyPage() { return <Suspense fallback={<div className="p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>}><NewPrivacyForm /></Suspense>; }
