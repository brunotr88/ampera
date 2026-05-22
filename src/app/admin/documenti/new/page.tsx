"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import {
  Check, ChevronRight, ChevronLeft, FileText, Loader2, Pen, Mail, Upload,
  Shield, AlertTriangle, FileCheck, FileX, FileQuestion, FileSignature, Printer, Download
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { key: "context", label: "Contesto" },
  { key: "fields", label: "Compilazione" },
  { key: "preview", label: "Anteprima" },
  { key: "sign", label: "Firma" },
] as const;

const CATEGORY_ICON: Record<string, any> = {
  SOPRALLUOGO: FileText, INCARICO: FileSignature, INIZIO_LAVORI: FileText,
  FINE_LAVORI: FileCheck, COLLAUDO: FileCheck, CONSEGNA: FileCheck,
  NON_CONFORMITA: AlertTriangle, MANCATO_ACCESSO: FileX, RIFIUTO: FileX,
  SAL: FileText, GARANZIA: Shield, RELAZIONE_TECNICA: FileText,
  VERIFICA_DPR462: FileCheck, FORMAZIONE: FileText, ALTRO: FileQuestion,
};

type SignatureChoice = "TABLET" | "OTP" | "PAPER_SCAN" | "SHARE_LINK";

function NewDocWizard() {
  const router = useRouter();
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [plants, setPlants] = useState<any[]>([]);

  const [selectedTpl, setSelectedTpl] = useState<any>(null);
  const [customerId, setCustomerId] = useState(sp.get("customerId") || "");
  const [plantId, setPlantId] = useState(sp.get("plantId") || "");
  const [title, setTitle] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  const [docId, setDocId] = useState<string | null>(null);
  const [signatureChoice, setSignatureChoice] = useState<SignatureChoice>("TABLET");
  const [signature, setSignature] = useState<string>("");
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [paperStage, setPaperStage] = useState<"idle" | "pdf-ready" | "uploading">("idle");
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/document-templates").then(r => r.json()).then(d => setTemplates(d.templates || []));
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);

  useEffect(() => {
    if (customerId) fetch(`/api/plants?customerId=${customerId}`).then(r => r.json()).then(d => setPlants(d.plants || []));
  }, [customerId]);

  const customKeys = useMemo(() => {
    if (!selectedTpl) return [];
    return Array.from(new Set([...selectedTpl.bodyTemplate.matchAll(/\{\{custom\.([a-zA-Z0-9_]+)\}\}/g)].map((m: any) => m[1])));
  }, [selectedTpl]);

  const [previewHtml, setPreviewHtml] = useState<string>("");

  useEffect(() => {
    if (!selectedTpl) { setPreviewHtml(""); return; }
    const customer = customers.find(c => c.id === customerId);
    const plant = plants.find(p => p.id === plantId);
    const now = new Date();
    const ctx: any = {
      date: now.toLocaleDateString("it-IT"),
      dateLong: now.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }),
      time: now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      year: String(now.getFullYear()),
      tenant: {},
      customer: customer ? { name: customer.name, surname: customer.surname || "", companyName: customer.companyName || "", fiscalCode: customer.fiscalCode || "", vatNumber: customer.vatNumber || "", email: customer.email || "", phone: customer.phone || "", address: "" } : {},
      plant: plant ? { name: plant.name, code: plant.code || "", type: plant.type || "", address: "" } : {},
      technician: {}, user: {}, workOrder: {},
      doc: { code: "PREVIEW", title: title || selectedTpl.title },
      custom: customFields,
    };
    const get = (path: string): string => {
      const parts = path.split(".");
      let cur: any = ctx;
      for (const p of parts) { if (cur == null) return ""; cur = cur[p]; }
      return cur != null ? String(cur) : "";
    };
    const body = selectedTpl.bodyTemplate.replace(/\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\}/g, (_: any, expr: string) => get(expr));
    setPreviewHtml(body);
  }, [selectedTpl, customerId, plantId, title, customFields, customers, plants]);

  function nextStep() {
    setError(null);
    if (step === 0) {
      if (!selectedTpl) { setError("Seleziona un modello"); return; }
      setStep(1);
      return;
    }
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      generateDoc().then(ok => { if (ok) setStep(3); });
      return;
    }
  }
  function prevStep() {
    setError(null);
    setStep(s => Math.max(0, s - 1));
  }

  async function generateDoc(): Promise<boolean> {
    if (!selectedTpl) return false;
    setBusy(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTpl.id,
          customerId: customerId || undefined,
          plantId: plantId || undefined,
          title: title || undefined,
          customFields,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { document } = await res.json();
      setDocId(document.id);
      toast.success("Documento generato");
      return true;
    } catch (e: any) { setError(e.message); return false; }
    finally { setBusy(false); }
  }

  async function signTablet() {
    if (!docId || !signature || !signerName) { toast.error("Compila firma e nome"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedByName: signerName, signedByEmail: signerEmail || undefined, signatureDataUrl: signature }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato");
      router.push(`/admin/documenti/${docId}`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function sendOtp() {
    if (!docId || !signerEmail) { toast.error("Email destinatario richiesta"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signerEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      setOtpSent(true);
      toast.success(`Codice inviato a ${signerEmail}`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  async function verifyOtp() {
    if (!docId || !otp || !signerName) { toast.error("OTP e nome richiesti"); return; }
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, signedByName: signerName, signedByEmail: signerEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato");
      router.push(`/admin/documenti/${docId}`);
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }
  function openPrintPaper() {
    if (!docId) return;
    window.open(`/print/document/${docId}?print=1`, "_blank");
    setPaperStage("pdf-ready");
  }
  async function uploadScan(file: File) {
    if (!docId) return;
    setBusy(true); setPaperStage("uploading");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("signedByName", signerName);
      if (signerEmail) fd.append("signedByEmail", signerEmail);
      const res = await fetch(`/api/documents/${docId}/upload-signed`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento caricato");
      router.push(`/admin/documenti/${docId}`);
    } catch (e: any) { setError(e.message); setPaperStage("pdf-ready"); } finally { setBusy(false); }
  }
  async function generateShareLink() {
    if (!docId) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${docId}/share-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresDays: 30 }) });
      if (!res.ok) throw new Error("Errore");
      const { token } = await res.json();
      const url = `${window.location.origin}/sign/${token}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      toast.success("Link copiato negli appunti");
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Nuovo documento" description={STEPS[step].label} back="/admin/documenti" />

      <Stepper currentStep={step} steps={STEPS.map(s => s.label)} />

      {error && (
        <Card className="border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/30">
          <CardContent className="py-3 px-4 text-sm text-rose-700 dark:text-rose-300">{error}</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <Card>
            <CardContent className="py-5 px-5">
              {step === 0 && (
                <StepContext
                  templates={templates} customers={customers} plants={plants}
                  selectedTpl={selectedTpl} onSelectTpl={setSelectedTpl}
                  customerId={customerId} onCustomerChange={setCustomerId}
                  plantId={plantId} onPlantChange={setPlantId}
                  title={title} onTitleChange={setTitle}
                />
              )}
              {step === 1 && selectedTpl && (
                <StepFields customKeys={customKeys as string[]} values={customFields} onChange={(k: string, v: string) => setCustomFields(f => ({ ...f, [k]: v }))} />
              )}
              {step === 2 && <StepPreviewInfo />}
              {step === 3 && docId && (
                <StepSign
                  signatureChoice={signatureChoice} onChoiceChange={setSignatureChoice}
                  signature={signature} onSignatureChange={setSignature}
                  signerName={signerName} onNameChange={setSignerName}
                  signerEmail={signerEmail} onEmailChange={setSignerEmail}
                  otp={otp} onOtpChange={setOtp} otpSent={otpSent}
                  paperStage={paperStage} shareUrl={shareUrl} busy={busy}
                  onSignTablet={signTablet} onSendOtp={sendOtp} onVerifyOtp={verifyOtp}
                  onPrintPaper={openPrintPaper} onUploadScan={uploadScan} onGenerateShareLink={generateShareLink}
                  customerEmail={customers.find(c => c.id === customerId)?.email || ""}
                />
              )}

              {step < 3 && (
                <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-border">
                  {step > 0 ? (
                    <Button variant="outline" onClick={prevStep} disabled={busy}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Indietro
                    </Button>
                  ) : <div />}
                  <Button onClick={nextStep} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    {step === 2 ? "Genera e firma" : "Avanti"}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
              {step === 3 && (
                <div className="mt-6 pt-4 border-t border-border">
                  <Button variant="outline" onClick={prevStep} disabled={busy}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Modifica documento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card className="sticky top-4">
            <CardContent className="py-4 px-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" /> Anteprima live
              </div>
              {selectedTpl ? (
                <div className="rounded-lg bg-muted/40 p-2">
                  <iframe
                    srcDoc={previewHtml}
                    className="w-full bg-white rounded-sm shadow-md border-0"
                    style={{ height: "70vh" }}
                    sandbox=""
                    title="Anteprima live"
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground p-3">Seleziona un modello per vedere l'anteprima.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stepper({ currentStep, steps }: { currentStep: number; steps: readonly string[] }) {
  return (
    <ol className="flex items-center gap-1 text-xs">
      {steps.map((label, i) => (
        <li key={label} className="flex items-center gap-1 flex-1">
          <div className={`flex-1 h-9 flex items-center gap-2 rounded-md px-3 ${
            i === currentStep ? "bg-primary text-primary-foreground font-semibold"
              : i < currentStep ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
              : "bg-muted text-muted-foreground"
          }`}>
            <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i === currentStep ? "bg-primary-foreground/20"
                : i < currentStep ? "bg-emerald-500 text-white"
                : "bg-background"
            }`}>{i < currentStep ? <Check className="h-3 w-3" /> : i + 1}</span>
            <span className="hidden sm:inline">{label}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepContext({ templates, customers, plants, selectedTpl, onSelectTpl, customerId, onCustomerChange, plantId, onPlantChange, title, onTitleChange }: any) {
  const grouped = templates.reduce((acc: Record<string, any[]>, t: any) => {
    (acc[t.category] = acc[t.category] || []).push(t);
    return acc;
  }, {});
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">1. Scegli il modello e il contesto</h2>
        <p className="text-xs text-muted-foreground mt-1">Seleziona il tipo di documento e collegalo a cliente/impianto (opzionale).</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Cliente</Label>
          <Select value={customerId} onChange={(e: any) => onCustomerChange(e.target.value)}>
            <option value="">— Nessuno —</option>
            {customers.map((c: any) => <option key={c.id} value={c.id}>{c.companyName || `${c.name} ${c.surname || ""}`.trim()}</option>)}
          </Select>
        </div>
        <div>
          <Label>Impianto</Label>
          <Select value={plantId} onChange={(e: any) => onPlantChange(e.target.value)} disabled={!customerId}>
            <option value="">—</option>
            {plants.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label>Titolo personalizzato (opzionale)</Label>
          <Input placeholder={selectedTpl?.title || "Eredita dal modello"} value={title} onChange={e => onTitleChange(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-sm font-semibold">Modello documento *</Label>
        <div className="space-y-4 mt-2 max-h-[400px] overflow-y-auto pr-2">
          {Object.entries(grouped).map(([cat, ts]: any) => (
            <div key={cat}>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{cat.replace(/_/g, " ")}</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {(ts as any[]).map((t: any) => {
                  const Icon = CATEGORY_ICON[t.category] || FileText;
                  const active = selectedTpl?.id === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => onSelectTpl(t)}
                      className={`text-left p-3 rounded-lg border transition-colors ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                      <div className="flex items-start justify-between mb-1">
                        <Icon className="h-4 w-4 text-primary" />
                        <Badge variant="muted" className="text-[9px]">{t.signerRole}</Badge>
                      </div>
                      <div className="font-semibold text-xs">{t.title}</div>
                      {t.legalReference && <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 italic">{t.legalReference}</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepFields({ customKeys, values, onChange }: any) {
  if (customKeys.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold">2. Compilazione campi</h2>
        <p className="text-sm text-muted-foreground">Questo modello non richiede campi aggiuntivi. Procedi all'anteprima.</p>
      </div>
    );
  }
  const longFields = /description|details|reason|facts|prescriptions|materials|sizing|workDescription|stateDescription|preexistingIssues|nonConformities|risks|recommendations|exclusions|programDetails|customerReason|companyPosition|witnesses|salTable/i;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">2. Compila i campi del modello</h2>
        <p className="text-xs text-muted-foreground mt-1">Lascia vuoto un campo per stamparlo come "___________".</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {customKeys.map((k: string) => {
          const isLong = longFields.test(k) || k.length > 16;
          const label = k.replace(/([A-Z])/g, " $1").trim();
          return (
            <div key={k} className={isLong ? "md:col-span-2" : ""}>
              <Label className="capitalize">{label}</Label>
              {isLong ? (
                <Textarea rows={3} value={values[k] || ""} onChange={e => onChange(k, e.target.value)} />
              ) : (
                <Input value={values[k] || ""} onChange={e => onChange(k, e.target.value)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepPreviewInfo() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">3. Anteprima documento</h2>
      <p className="text-sm text-muted-foreground">
        Controlla l'anteprima a destra. Premendo "Genera e firma" il documento verrà creato (status READY) e potrai firmare.
      </p>
      <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
        <div>• I dati del cliente/impianto sono compilati automaticamente</div>
        <div>• I placeholders mancanti appaiono come "___________"</div>
        <div>• Una volta firmato, il documento diventa immutabile (puoi revocarlo)</div>
      </div>
    </div>
  );
}

function StepSign({
  signatureChoice, onChoiceChange,
  signature, onSignatureChange,
  signerName, onNameChange,
  signerEmail, onEmailChange,
  otp, onOtpChange, otpSent,
  paperStage, shareUrl, busy,
  onSignTablet, onSendOtp, onVerifyOtp, onPrintPaper, onUploadScan, onGenerateShareLink,
  customerEmail,
}: any) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">4. Scegli modalità firma</h2>
        <p className="text-xs text-muted-foreground mt-1">Seleziona come far firmare il cliente.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: "TABLET" as const, l: "Tablet/Mouse", icon: Pen },
          { v: "OTP" as const, l: "OTP Email", icon: Mail },
          { v: "PAPER_SCAN" as const, l: "Stampa + scansione", icon: Printer },
          { v: "SHARE_LINK" as const, l: "Link al cliente", icon: FileSignature },
        ].map(o => {
          const Icon = o.icon;
          const active = signatureChoice === o.v;
          return (
            <button key={o.v} type="button" onClick={() => onChoiceChange(o.v)}
              className={`p-3 rounded-lg border text-left ${active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
              <Icon className={`h-4 w-4 mb-1 ${active ? "text-primary" : ""}`} />
              <div className="text-xs font-semibold">{o.l}</div>
            </button>
          );
        })}
      </div>

      {signatureChoice === "TABLET" && (
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div><Label>Nome firmatario *</Label><Input value={signerName} onChange={e => onNameChange(e.target.value)} /></div>
            <div><Label>Email (opz.)</Label><Input type="email" value={signerEmail} onChange={e => onEmailChange(e.target.value)} /></div>
          </div>
          <div><Label>Firma *</Label><SignaturePadComponent onSave={onSignatureChange} /></div>
          <Button onClick={onSignTablet} disabled={busy || !signature || !signerName} className="w-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pen className="h-4 w-4" />} Conferma firma
          </Button>
        </div>
      )}

      {signatureChoice === "OTP" && (
        <div className="space-y-3">
          {!otpSent ? (
            <>
              <div><Label>Email destinatario *</Label><Input type="email" placeholder={customerEmail} value={signerEmail} onChange={e => onEmailChange(e.target.value)} /></div>
              <Button onClick={onSendOtp} disabled={busy || !signerEmail} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Invia codice
              </Button>
            </>
          ) : (
            <>
              <div className="text-sm text-emerald-700 dark:text-emerald-300">✓ Codice inviato a {signerEmail}</div>
              <div><Label>Nome firmatario *</Label><Input value={signerName} onChange={e => onNameChange(e.target.value)} /></div>
              <div><Label>Codice OTP (6 cifre) *</Label><Input value={otp} onChange={e => onOtpChange(e.target.value.replace(/\D/g, "").slice(0, 6))} maxLength={6} className="text-2xl tracking-widest text-center font-mono" /></div>
              <Button onClick={onVerifyOtp} disabled={busy || otp.length !== 6 || !signerName} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Verifica e firma
              </Button>
            </>
          )}
        </div>
      )}

      {signatureChoice === "PAPER_SCAN" && (
        <div className="space-y-3">
          <div className="bg-muted/30 p-4 rounded-lg text-sm space-y-1">
            <p className="font-semibold">Workflow firma cartacea:</p>
            <ol className="list-decimal ml-5 space-y-1 text-xs">
              <li>Stampa il documento (apre nuova scheda)</li>
              <li>Fai firmare il cliente</li>
              <li>Scansiona o fotografa il foglio</li>
              <li>Carica il file qui sotto</li>
            </ol>
          </div>
          {paperStage === "idle" && (
            <Button onClick={onPrintPaper} className="w-full">
              <Download className="h-4 w-4" /> Stampa documento
            </Button>
          )}
          {paperStage !== "idle" && (
            <div className="space-y-3">
              <div className="text-sm text-emerald-700 dark:text-emerald-300">✓ Stampa avviata in nuova scheda</div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><Label>Nome firmatario *</Label><Input value={signerName} onChange={e => onNameChange(e.target.value)} /></div>
                <div><Label>Email (opz.)</Label><Input type="email" value={signerEmail} onChange={e => onEmailChange(e.target.value)} /></div>
              </div>
              <div><Label>PDF/immagine firmati *</Label><input type="file" accept="application/pdf,image/*" onChange={e => { const f = e.target.files?.[0]; if (f && signerName) onUploadScan(f); else if (!signerName) toast.error("Inserisci prima il nome firmatario"); }} className="block w-full text-sm" /></div>
              <p className="text-xs text-muted-foreground">{paperStage === "uploading" ? "Caricamento in corso..." : "Compila i campi e seleziona il file scansionato"}</p>
            </div>
          )}
        </div>
      )}

      {signatureChoice === "SHARE_LINK" && (
        <div className="space-y-3">
          <div className="bg-muted/30 p-4 rounded-lg text-sm">
            Genera un link sicuro da inviare al cliente. Potrà firmare online (tablet o OTP) senza login.
          </div>
          {!shareUrl ? (
            <Button onClick={onGenerateShareLink} disabled={busy} className="w-full">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Genera link firma
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Link generato (copiato negli appunti)</Label>
              <Input value={shareUrl} readOnly className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">Invia via email/WhatsApp. Scade tra 30 giorni.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewDocPage() {
  return <Suspense><NewDocWizard /></Suspense>;
}
