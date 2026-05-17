"use client";
import { useEffect, useRef, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Mic, MicOff, Plus, Minus, Camera, Trash2, Loader2, CheckCircle2, MapPin, Pencil, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import { toast } from "sonner";

type Material = { materialId?: string; code?: string; description: string; quantity: number; unit: string; unitPrice: number; warehouseId?: string };
type Photo = { dataUrl: string; label?: string; lat?: number; lon?: number };

const TYPES = [
  { v: "MAINTENANCE", l: "🔧 Manutenzione" },
  { v: "FAULT", l: "⚡ Guasto" },
  { v: "NEW_INSTALL", l: "🆕 Nuovo impianto" },
  { v: "INSPECTION", l: "✓ Collaudo" },
  { v: "SURVEY", l: "📄 Sopralluogo" },
  { v: "OTHER", l: "🛠️ Altro" },
];

const CAUSES = ["Corto circuito", "Sovraccarico", "Componente rotto", "Cablaggio errato", "Usura", "Umidità", "Altro"];

export default function ReportWizard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [wo, setWo] = useState<any>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [tenantUsers, setTenantUsers] = useState<any[]>([]);

  const [form, setForm] = useState<any>({
    workType: "", cause: "", description: "", recommendations: "",
    totalHours: 0.5, travelKm: 0, contactPerson: "", signerName: "",
  });
  const [materials, setMaterials] = useState<Material[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [matSearch, setMatSearch] = useState("");
  const [matResults, setMatResults] = useState<any[]>([]);
  const [recentMaterials, setRecentMaterials] = useState<any[]>([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientId = useRef(`r-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  const startedAt = useRef(new Date()); // timer start

  useEffect(() => {
    fetch(`/api/work-orders?mine=1`).then(r => r.json()).then(d => {
      const x = d.workOrders?.find((w: any) => w.id === id);
      setWo(x);
      if (x?.contactPerson) setForm((f: any) => ({ ...f, contactPerson: x.contactPerson }));
    });
    fetch("/api/warehouses").then(r => r.json()).then(d => setWarehouses(d.warehouses || []));
    fetch("/api/users").then(r => r.json()).then(d => setTenantUsers(d.users || []));
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (matSearch.length < 2) { setMatResults([]); return; }
      fetch(`/api/materials?q=${encodeURIComponent(matSearch)}`).then(r => r.json()).then(d => setMatResults(d.materials || []));
    }, 200);
    return () => clearTimeout(t);
  }, [matSearch]);

  // voice input
  function toggleVoice() {
    if (voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { toast.error("Speech recognition non supportato"); return; }
    const r = new SR();
    r.lang = "it-IT"; r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) txt += e.results[i][0].transcript + " ";
      }
      if (txt) setForm((f: any) => ({ ...f, description: (f.description ? f.description + " " : "") + txt.trim() }));
    };
    r.onerror = () => setVoiceListening(false);
    r.onend = () => setVoiceListening(false);
    r.start();
    recognitionRef.current = r;
    setVoiceListening(true);
  }

  function addMaterial(m: any) {
    setMaterials([...materials, { materialId: m.id, code: m.code, description: m.name, quantity: 1, unit: m.unit || "pz", unitPrice: m.unitPrice || 0, warehouseId: warehouses[0]?.id }]);
    setRecentMaterials(rs => [m, ...rs.filter(r => r.id !== m.id)].slice(0, 8));
    setMatSearch(""); setMatResults([]);
  }

  async function captureFromInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 1280, 0.7);
    let lat: number | undefined, lon: number | undefined;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        lat = pos.coords.latitude; lon = pos.coords.longitude;
      } catch {}
    }
    setPhotos(ps => [...ps, { dataUrl: compressed, lat, lon }]);
    e.target.value = "";
  }

  async function compressImage(file: File, maxDim = 1280, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const r = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const c = document.createElement("canvas");
        c.width = img.width * r; c.height = img.height * r;
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  async function submit() {
    if (!signature) return toast.error("Manca la firma del cliente");
    if (!form.signerName) return toast.error("Manca il nome firmatario");
    setSubmitting(true);
    let endLat: number | undefined, endLon: number | undefined;
    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
        endLat = pos.coords.latitude; endLon = pos.coords.longitude;
      } catch {}
    }
    const payload = {
      clientId: clientId.current,
      workOrderId: id,
      customerId: wo.customerId,
      siteId: wo.siteId,
      plantId: wo.plantId,
      projectId: wo.projectId,
      workType: form.workType,
      cause: form.cause,
      description: form.description,
      recommendations: form.recommendations,
      startedAt: startedAt.current,
      endedAt: new Date(),
      totalHours: Number(form.totalHours),
      travelKm: Number(form.travelKm),
      endLat, endLon,
      contactPerson: form.contactPerson,
      signerName: form.signerName,
      signedAt: new Date(),
      signatureDataUrl: signature,
      materials,
      timeEntries: [{ userId: wo.assignedToId, hours: Number(form.totalHours), hourlyRate: 35 }],
      photosBase64: photos,
      finalize: true,
    };

    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.json()).error?.message || "Errore");
      const { report } = await res.json();
      toast.success("Rapportino salvato!");
      router.push(`/operatore/done?reportId=${report.id}`);
    } catch (e: any) {
      // Save to localStorage queue for retry
      try {
        const queue = JSON.parse(localStorage.getItem("ampera_offline_reports") || "[]");
        queue.push({ id: clientId.current, payload, queuedAt: Date.now() });
        localStorage.setItem("ampera_offline_reports", JSON.stringify(queue));
        toast.warning("Salvato offline, sincronizzeremo appena hai connessione");
      } catch {}
      toast.error(e.message);
    } finally { setSubmitting(false); }
  }

  if (!wo) return <div className="p-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>;

  return (
    <div className="max-w-md mx-auto pb-32">
      <header className="px-5 pt-5 pb-2 flex items-center gap-3">
        <Link href={`/operatore/work-orders/${id}`} className="text-slate-500"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="text-xs text-slate-500">Step {step} di 6</div>
          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
            <div className="h-full bg-ampera-700 transition-all" style={{ width: `${(step / 6) * 100}%` }} />
          </div>
        </div>
      </header>

      {step === 1 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Cliente confermato?</h2>
          <div className="bg-white rounded-xl p-4 border space-y-2">
            <div className="font-semibold">{wo.customer.companyName || `${wo.customer.name} ${wo.customer.surname || ""}`}</div>
            {wo.site && <div className="text-sm text-slate-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {wo.site.street}, {wo.site.city}</div>}
            {wo.plant && <div className="text-sm text-slate-600">Impianto: <strong>{wo.plant.name}</strong></div>}
          </div>
          <div><Label>Referente in cantiere</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} placeholder="Es. Sig. Rossi (proprietario)" /></div>
          <Button size="lg" onClick={() => setStep(2)} className="w-full bg-ampera-700 mt-4">Continua <ChevronRight className="h-4 w-4" /></Button>
        </section>
      )}

      {step === 2 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Cosa è stato fatto?</h2>
          <div>
            <Label>Tipo intervento</Label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.v} type="button" onClick={() => setForm({ ...form, workType: t.v })} className={`p-3 rounded-xl border text-sm font-medium ${form.workType === t.v ? "bg-ampera-700 text-white border-ampera-700" : "bg-white"}`}>{t.l}</button>
              ))}
            </div>
          </div>
          {form.workType === "FAULT" && (
            <div>
              <Label>Causa</Label>
              <div className="flex flex-wrap gap-2">
                {CAUSES.map(c => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, cause: c })} className={`px-3 py-2 rounded-lg border text-sm ${form.cause === c ? "bg-amber-100 border-amber-300 text-amber-800" : "bg-white"}`}>{c}</button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(1)} className="flex-1"><ChevronLeft className="h-4 w-4" /> Indietro</Button>
            <Button size="lg" onClick={() => setStep(3)} disabled={!form.workType} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Cosa hai fatto?</h2>
          <div>
            <Label>Descrizione lavori</Label>
            <div className="relative">
              <Textarea rows={6} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Sii specifico: componente, causa, soluzione." className="pr-12" />
              <button type="button" onClick={toggleVoice} className={`absolute right-2 bottom-2 p-2 rounded-full ${voiceListening ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-slate-600"}`}>
                {voiceListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Tap il microfono per dettare</div>
          </div>
          <div>
            <Label>Raccomandazioni per il cliente (opzionale)</Label>
            <Textarea rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} placeholder="Es. Consigliato controllo termografico tra 6 mesi" />
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(2)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(4)} disabled={!form.description} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Tempo</h2>
          <div>
            <Label>Ore lavorate</Label>
            <div className="flex items-center justify-center gap-4 my-4">
              <Button type="button" size="icon" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setForm({ ...form, totalHours: Math.max(0, form.totalHours - 0.5) })}><Minus className="h-6 w-6" /></Button>
              <div className="text-center">
                <div className="font-display text-5xl font-bold text-ampera-700">{form.totalHours.toFixed(1)}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">ORE</div>
              </div>
              <Button type="button" size="icon" variant="outline" className="h-14 w-14 rounded-full" onClick={() => setForm({ ...form, totalHours: form.totalHours + 0.5 })}><Plus className="h-6 w-6" /></Button>
            </div>
          </div>
          <div>
            <Label>Km trasferta</Label>
            <Input type="number" min="0" step="1" value={form.travelKm} onChange={e => setForm({ ...form, travelKm: Number(e.target.value) })} />
          </div>
          <div className="text-xs text-slate-500 text-center bg-slate-50 rounded-lg p-3">
            Iniziato alle {startedAt.current.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(3)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(5)} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Materiali utilizzati</h2>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Cerca articolo, codice METEL…" value={matSearch} onChange={e => setMatSearch(e.target.value)} />
            {matResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto z-20">
                {matResults.slice(0, 10).map(m => (
                  <button key={m.id} type="button" onClick={() => addMaterial(m)} className="w-full text-left p-2 hover:bg-slate-50 border-b last:border-0">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500">{m.code} · {m.unitPrice}€</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {recentMaterials.length > 0 && (
            <div>
              <div className="text-xs text-slate-500 mb-2">⭐ Usati di recente</div>
              <div className="flex flex-wrap gap-2">
                {recentMaterials.map(m => (
                  <button key={m.id} type="button" onClick={() => addMaterial(m)} className="bg-slate-100 hover:bg-slate-200 text-xs rounded-full px-3 py-1">{m.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {materials.length === 0 ? <p className="text-sm text-slate-500 text-center py-4">Nessun materiale aggiunto</p> :
              materials.map((m, i) => (
                <div key={i} className="bg-white border rounded-xl p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{m.description}</div>
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
              <Label>Scarico dal magazzino</Label>
              <Select value={materials[0]?.warehouseId || ""} onChange={e => setMaterials(ms => ms.map(m => ({ ...m, warehouseId: e.target.value })))}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.type})</option>)}
              </Select>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2">
            <Button variant="outline" size="lg" onClick={() => setStep(4)} className="flex-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setStep(6)} className="flex-1 bg-ampera-700">Avanti <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      {step === 6 && (
        <section className="px-5 pt-4 space-y-4">
          <h2 className="font-display text-xl font-bold">Foto e firma</h2>

          <div>
            <Label>Foto cantiere ({photos.length}/10)</Label>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={captureFromInput} className="hidden" />
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center bg-white hover:bg-slate-50">
                <Camera className="h-6 w-6 text-slate-400" />
                <span className="text-xs mt-1 text-slate-500">Aggiungi</span>
              </button>
              {photos.map((p, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                  <img src={p.dataUrl} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos(ps => ps.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">Foto geo-taggate automaticamente</div>
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
            <Input required value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })} placeholder="Sig. Mario Rossi" />
          </div>

          <div className="flex flex-col gap-3 pt-3">
            <Button size="xl" onClick={submit} disabled={submitting || !signature || !form.signerName} className="w-full bg-emerald-600 hover:bg-emerald-700 py-5 text-lg shadow-lg">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Conferma e termina</>}
            </Button>
            <Button variant="outline" onClick={() => setStep(5)}><ChevronLeft className="h-4 w-4" /> Indietro</Button>
          </div>
        </section>
      )}
    </div>
  );
}
