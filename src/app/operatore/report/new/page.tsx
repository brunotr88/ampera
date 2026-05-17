"use client";
/**
 * Rapportino "libero" (senza work order pre-assegnato): operatore sceglie cliente,
 * compila interventi multi-riga, foto, firma. Dopo submit -> 10 min per annullare.
 * Una volta scaduti i 10 min: email a tenant.reportNotificationEmail + PDF salvato.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import { INTERVENTION_VARIANTS, getVariantsByType } from "@/lib/intervention-variants";
import {
  ChevronLeft, ChevronRight, Mic, MicOff, Plus, Minus, Camera, Trash2, Loader2, CheckCircle2,
  Search, UserPlus, Pencil, Sparkles, X
} from "lucide-react";
import { toast } from "sonner";

type InterventionRow = { variantId?: string; label: string; notes: string };
type MaterialRow = { materialId?: string; code?: string; description: string; quantity: number; unit: string };
type Photo = { dataUrl: string; lat?: number; lon?: number };

export default function FreeReportWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // STEP 1 - Cliente
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCust, setNewCust] = useState<any>({ name: "", phone: "", address: "" });
  const [creatingCust, setCreatingCust] = useState(false);

  // STEP 2 - Interventi
  const [workType, setWorkType] = useState<string>("MAINTENANCE");
  const [interventions, setInterventions] = useState<InterventionRow[]>([{ label: "", notes: "" }]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTargetIdx, setVoiceTargetIdx] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // STEP 3 - Tempo
  const [hours, setHours] = useState(0.5);
  const [travelKm, setTravelKm] = useState(0);

  // STEP 4 - Materiali (no prices)
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [matSearch, setMatSearch] = useState("");
  const [matResults, setMatResults] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>("");

  // STEP 5 - Foto + Firma
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startedAt = useRef(new Date());
  const clientId = useRef(`r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // Load lookup data
  useEffect(() => {
    fetch("/api/warehouses").then(r => r.json()).then(d => {
      setWarehouses(d.warehouses || []);
      const myVan = d.warehouses?.find((w: any) => w.type === "VAN");
      if (myVan) setWarehouseId(myVan.id);
    });
    fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || []));
  }, []);

  // Customer search
  useEffect(() => {
    if (customerQuery.length < 2) { setCustomerResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/customers?q=${encodeURIComponent(customerQuery)}`, { signal: ctrl.signal });
        const d = await r.json();
        setCustomerResults(d.customers?.slice(0, 8) || []);
      } catch {}
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [customerQuery]);

  // Materials search
  useEffect(() => {
    if (matSearch.length < 2) { setMatResults([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/materials?q=${encodeURIComponent(matSearch)}`, { signal: ctrl.signal });
        const d = await r.json();
        setMatResults(d.materials?.slice(0, 8) || []);
      } catch {}
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [matSearch]);

  async function createCustomer() {
    if (!newCust.name) return toast.error("Nome cliente obbligatorio");
    setCreatingCust(true);
    try {
      const res = await fetch("/api/customers/quick", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCust.name,
          phone: newCust.phone,
          companyName: newCust.companyName,
          email: newCust.email,
          address: newCust.address ? { street: newCust.address, city: newCust.city || "" } : undefined,
        }),
      });
      if (!res.ok) throw new Error("Errore");
      const { customer: c } = await res.json();
      setCustomer(c);
      setCustomerQuery(c.companyName || c.name);
      setShowNewCustomer(false);
      toast.success("Cliente creato");
    } catch (e: any) { toast.error(e.message); } finally { setCreatingCust(false); }
  }

  function pickVariant(idx: number, variantId: string) {
    const variants = getVariantsByType(workType);
    const v = variants.find(x => x.id === variantId);
    if (!v) return;
    setInterventions(rs => rs.map((r, i) => i === idx ? { ...r, variantId, label: v.label } : r));
  }

  function startVoice(targetIdx: number | null = null) {
    if (voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      setVoiceTargetIdx(null);
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Dettatura non supportata"); return; }
    const r = new SR();
    r.lang = "it-IT"; r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript + " ";
      }
      if (!txt) return;
      if (targetIdx === null) {
        setGeneralNotes(g => (g ? g + " " : "") + txt.trim());
      } else {
        setInterventions(rs => rs.map((row, i) => i === targetIdx ? { ...row, notes: (row.notes ? row.notes + " " : "") + txt.trim() } : row));
      }
    };
    r.onerror = () => setVoiceListening(false);
    r.onend = () => { setVoiceListening(false); setVoiceTargetIdx(null); };
    r.start();
    recognitionRef.current = r;
    setVoiceListening(true);
    setVoiceTargetIdx(targetIdx);
  }

  function addMaterial(m: any) {
    setMaterials(ms => [...ms, { materialId: m.id, code: m.code, description: m.name, quantity: 1, unit: m.unit || "pz" }]);
    setMatSearch(""); setMatResults([]);
  }

  async function compressImage(file: File, maxDim = 1280, q = 0.75): Promise<string> {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const c = document.createElement("canvas");
        c.width = img.width * r; c.height = img.height * r;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", q));
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
  }

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressImage(file);
    let lat: number | undefined, lon: number | undefined;
    if (navigator.geolocation) {
      try {
        const p = await new Promise<GeolocationPosition>((r, j) => navigator.geolocation.getCurrentPosition(r, j, { timeout: 4000 }));
        lat = p.coords.latitude; lon = p.coords.longitude;
      } catch {}
    }
    setPhotos(ps => [...ps, { dataUrl, lat, lon }]);
    e.target.value = "";
  }

  async function submit() {
    if (!customer) return toast.error("Seleziona o crea un cliente");
    if (!signature) return toast.error("Manca la firma del cliente");
    if (!signerName) return toast.error("Nome firmatario obbligatorio");

    // Compose description from interventions
    const validRows = interventions.filter(r => r.label.trim());
    if (validRows.length === 0) return toast.error("Aggiungi almeno una voce di intervento");

    const description = validRows.map(r => `• ${r.label}${r.notes ? `\n   ${r.notes}` : ""}`).join("\n");
    const rowsJson = validRows.map(r => ({ variantId: r.variantId, label: r.label, notes: r.notes }));

    setSubmitting(true);
    let endLat: number | undefined, endLon: number | undefined;
    if (navigator.geolocation) {
      try {
        const p = await new Promise<GeolocationPosition>((r, j) => navigator.geolocation.getCurrentPosition(r, j, { timeout: 4000 }));
        endLat = p.coords.latitude; endLon = p.coords.longitude;
      } catch {}
    }

    const payload = {
      clientId: clientId.current,
      customerId: customer.id,
      workType,
      description,
      recommendations: recommendations || null,
      startedAt: startedAt.current,
      endedAt: new Date(),
      totalHours: Number(hours),
      travelKm: Number(travelKm),
      endLat, endLon,
      signerName,
      signedAt: new Date(),
      signatureDataUrl: signature,
      materials: materials.map(m => ({ ...m, unitPrice: 0, warehouseId })),
      timeEntries: [],
      photosBase64: photos.map(p => ({ dataUrl: p.dataUrl, lat: p.lat, lon: p.lon })),
      finalize: true,
      rowsJson,
    };

    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Errore");
      const { report } = await res.json();
      router.push(`/operatore/done?reportId=${report.id}&cancellable=1`);
    } catch (e: any) {
      // Save to localStorage queue for retry
      try {
        const q = JSON.parse(localStorage.getItem("ampera_offline_reports") || "[]");
        q.push({ id: clientId.current, payload, queuedAt: Date.now() });
        localStorage.setItem("ampera_offline_reports", JSON.stringify(q));
        toast.warning("Salvato offline, sincronizzeremo appena hai rete");
      } catch {}
      toast.error(e.message);
    } finally { setSubmitting(false); }
  }

  const currentVariants = getVariantsByType(workType);
  const customerLabel = customer ? (customer.companyName || `${customer.name} ${customer.surname || ""}`.trim()) : "";

  return (
    <div className="max-w-md mx-auto pb-32 min-h-screen">
      <header className="px-5 pt-5 pb-2 flex items-center gap-3">
        <Link href="/operatore" className="text-slate-500 dark:text-slate-400"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">Step {step} di 5 · Rapportino libero</div>
          <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-ampera-700 transition-all" style={{ width: `${(step / 5) * 100}%` }} />
          </div>
        </div>
      </header>

      {/* STEP 1 - Cliente */}
      {step === 1 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Per chi è il rapportino?</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-10 h-12"
              placeholder="Cerca cliente per nome, P.IVA, email…"
              value={customerQuery}
              onChange={e => { setCustomerQuery(e.target.value); setCustomer(null); }}
              autoFocus
            />
            {customerResults.length > 0 && !customer && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
                {customerResults.map(c => (
                  <button key={c.id} type="button" onClick={() => { setCustomer(c); setCustomerQuery(c.companyName || c.name); setCustomerResults([]); }}
                    className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0">
                    <div className="font-medium text-sm">{c.companyName || `${c.name} ${c.surname || ""}`.trim()}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{c.vatNumber || c.fiscalCode || c.email || c.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {customer && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold">{customerLabel}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">{customer.email || customer.phone || "—"}</div>
                </div>
                <button type="button" onClick={() => { setCustomer(null); setCustomerQuery(""); }} className="text-slate-400"><X className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {!showNewCustomer && (
            <button type="button" onClick={() => setShowNewCustomer(true)}
              className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center gap-2 hover:border-ampera-700">
              <UserPlus className="h-4 w-4 text-ampera-700 dark:text-ampera-400" />
              <span className="text-sm font-medium">Cliente non in elenco? Crea nuovo</span>
            </button>
          )}

          {showNewCustomer && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Nuovo cliente rapido</h3>
                <button type="button" onClick={() => setShowNewCustomer(false)} className="text-slate-400"><X className="h-4 w-4" /></button>
              </div>
              <div><Label>Nome / Ragione sociale *</Label><Input value={newCust.name} onChange={e => setNewCust({ ...newCust, name: e.target.value })} placeholder="Mario Rossi / Azienda SRL" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Telefono</Label><Input value={newCust.phone || ""} onChange={e => setNewCust({ ...newCust, phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={newCust.email || ""} onChange={e => setNewCust({ ...newCust, email: e.target.value })} /></div>
              </div>
              <div><Label>Indirizzo</Label><Input value={newCust.address || ""} onChange={e => setNewCust({ ...newCust, address: e.target.value })} placeholder="Via, civico" /></div>
              <div><Label>Città</Label><Input value={newCust.city || ""} onChange={e => setNewCust({ ...newCust, city: e.target.value })} /></div>
              <Button type="button" onClick={createCustomer} disabled={creatingCust} className="w-full">
                {creatingCust ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Crea e seleziona
              </Button>
              <p className="text-xs text-slate-500 dark:text-slate-400">L'ufficio completerà i dati fiscali (P.IVA/CF, SDI) in seguito.</p>
            </div>
          )}

          <Button size="lg" onClick={() => setStep(2)} disabled={!customer} className="w-full bg-ampera-700 mt-3">
            Continua <ChevronRight className="h-4 w-4" />
          </Button>
        </section>
      )}

      {/* STEP 2 - Interventi multi-riga */}
      {step === 2 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Cosa hai fatto?</h2>

          <div>
            <Label>Tipologia generale</Label>
            <div className="grid grid-cols-2 gap-2">
              {INTERVENTION_VARIANTS.map(g => (
                <button key={g.type} type="button" onClick={() => setWorkType(g.type)}
                  className={`p-3 rounded-xl border text-sm font-medium ${workType === g.type ? "bg-ampera-700 text-white border-ampera-700" : "bg-white dark:bg-slate-900"}`}>
                  {g.emoji} {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="m-0">Voci di intervento</Label>
              <Button type="button" size="sm" variant="outline"
                onClick={() => setInterventions([...interventions, { label: "", notes: "" }])}>
                <Plus className="h-3 w-3" /> Aggiungi
              </Button>
            </div>

            <div className="space-y-3">
              {interventions.map((row, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-full bg-ampera-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-1">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <Select value={row.variantId || ""} onChange={e => pickVariant(i, e.target.value)}>
                        <option value="">— Scegli variante predefinita —</option>
                        {currentVariants.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                      </Select>
                      <Input className="mt-2" placeholder="Oppure scrivi descrizione libera" value={row.label}
                        onChange={e => setInterventions(rs => rs.map((r, idx) => idx === i ? { ...r, label: e.target.value, variantId: undefined } : r))} />
                    </div>
                    {interventions.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0"
                        onClick={() => setInterventions(rs => rs.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <Textarea rows={2} placeholder="Note specifiche per questa voce…" value={row.notes}
                      onChange={e => setInterventions(rs => rs.map((r, idx) => idx === i ? { ...r, notes: e.target.value } : r))} className="pr-10 text-sm" />
                    <button type="button" onClick={() => startVoice(i)}
                      className={`absolute right-2 bottom-2 p-1.5 rounded-full ${voiceListening && voiceTargetIdx === i ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                      {voiceListening && voiceTargetIdx === i ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Note generali (opzionale)</Label>
            <div className="relative">
              <Textarea rows={3} placeholder="Eventuali osservazioni complessive sull'intervento…" value={generalNotes}
                onChange={e => setGeneralNotes(e.target.value)} className="pr-10" />
              <button type="button" onClick={() => startVoice(null)}
                className={`absolute right-2 bottom-2 p-1.5 rounded-full ${voiceListening && voiceTargetIdx === null ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 dark:bg-slate-800 text-slate-600"}`}>
                {voiceListening && voiceTargetIdx === null ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
              </button>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Tap microfono per dettare</div>
          </div>

          <div>
            <Label>Raccomandazioni per il cliente (opzionale)</Label>
            <Textarea rows={2} placeholder="Es. Controllo termografico tra 6 mesi" value={recommendations} onChange={e => setRecommendations(e.target.value)} />
          </div>

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(3)} className="flex-1 bg-ampera-700"
              disabled={!interventions.some(r => r.label.trim())}>Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {/* STEP 3 - Tempo */}
      {step === 3 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Quanto tempo?</h2>
          <div>
            <Label>Ore lavorate</Label>
            <div className="flex items-center justify-center gap-4 my-4">
              <Button type="button" size="icon" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setHours(Math.max(0, hours - 0.5))}><Minus className="h-6 w-6" /></Button>
              <div className="text-center">
                <div className="font-display text-5xl font-bold text-ampera-700 dark:text-ampera-400">{hours.toFixed(1)}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">ORE</div>
              </div>
              <Button type="button" size="icon" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setHours(hours + 0.5)}><Plus className="h-6 w-6" /></Button>
            </div>
          </div>
          <div>
            <Label>Km trasferta</Label>
            <Input type="number" min="0" step="1" value={travelKm} onChange={e => setTravelKm(Number(e.target.value))} />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            Iniziato alle {startedAt.current.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(4)} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {/* STEP 4 - Materiali */}
      {step === 4 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Materiali utilizzati</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aggiungi solo se hai usato materiali dal magazzino/furgone. È opzionale.</p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Cerca articolo, codice…" value={matSearch} onChange={e => setMatSearch(e.target.value)} />
            {matResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
                {matResults.map(m => (
                  <button key={m.id} type="button" onClick={() => addMaterial(m)}
                    className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-0">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.code}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {materials.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Nessun materiale</p> :
              materials.map((m, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{m.description}</div>
                      <div className="text-xs text-slate-500">{m.code}</div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setMaterials(ms => ms.filter((_, idx) => idx !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setMaterials(ms => ms.map((x, idx) => idx === i ? { ...x, quantity: Math.max(0, x.quantity - 1) } : x))}><Minus className="h-3 w-3" /></Button>
                    <Input className="w-16 text-center" type="number" step="0.01" value={m.quantity} onChange={e => setMaterials(ms => ms.map((x, idx) => idx === i ? { ...x, quantity: Number(e.target.value) } : x))} />
                    <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={() => setMaterials(ms => ms.map((x, idx) => idx === i ? { ...x, quantity: x.quantity + 1 } : x))}><Plus className="h-3 w-3" /></Button>
                    <span className="text-xs text-slate-500 ml-1">{m.unit}</span>
                  </div>
                </div>
              ))
            }
          </div>

          {warehouses.length > 0 && materials.length > 0 && (
            <div>
              <Label>Scarica dal magazzino</Label>
              <Select value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(3)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(5)} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {/* STEP 5 - Foto + Firma */}
      {step === 5 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Foto e firma</h2>

          <div>
            <Label>Foto cantiere ({photos.length}/10)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={onFilePick} className="hidden" />
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-xs mt-1 text-slate-500">Aggiungi</span>
              </button>
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(ps => ps.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label>Firma cliente</Label>
            {signature ? (
              <div className="border rounded-xl p-2 bg-white">
                <img src={signature} alt="firma" className="max-h-32 mx-auto" />
                <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={() => setSignature(null)}><Pencil className="h-3 w-3" /> Rifirma</Button>
              </div>
            ) : (
              <SignaturePadComponent onSave={setSignature} height={180} />
            )}
          </div>

          <div>
            <Label>Nome firmatario *</Label>
            <Input required value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Sig. Mario Rossi" />
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-xs text-amber-800 dark:text-amber-200">
            ⚠ Dopo la conferma avrai <strong>10 minuti</strong> per annullare il rapportino. Dopo questo intervallo il rapportino diventa definitivo e viene inviato in amministrazione.
          </div>

          <div className="flex flex-col gap-3 pt-3">
            <Button size="xl" onClick={submit} disabled={submitting || !signature || !signerName}
              className="w-full bg-emerald-600 hover:bg-emerald-700 py-5 text-lg shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Conferma e firma</>}
            </Button>
            <Button variant="outline" onClick={() => setStep(4)}><ChevronLeft className="h-4 w-4" /> Indietro</Button>
          </div>
        </section>
      )}
    </div>
  );
}
