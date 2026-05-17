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
import { Save, Loader2, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

function NewIncentiveForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [defs, setDefs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    type: sp.get("type") || "RESTRUCTURING_50",
    totalAmount: 0,
    workDescription: "",
    cessionAccredito: false,
    sconfoFattura: false,
    technicalAsseveration: false,
  });

  useEffect(() => {
    fetch("/api/incentives").then(r => r.json()).then(d => setDefs(d.definitions || []));
    fetch("/api/customers").then(r => r.json()).then(d => setCustomers(d.customers || []));
  }, []);

  const def = defs.find(d => d.type === form.type);
  const cappedAmount = def?.maxAmount ? Math.min(Number(form.totalAmount || 0), def.maxAmount) : Number(form.totalAmount || 0);
  const deductible = def ? (cappedAmount * def.percentage) / 100 : 0;
  const yearly = def ? deductible / def.yearsRecovery : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/incentives", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { application } = await res.json();
      toast.success("Pratica creata");
      router.push(`/admin/incentives/${application.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-4xl mx-auto">
      <PageHeader title="Nuova pratica agevolazione" back="/admin/incentives"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea pratica</Button>} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Tipologia agevolazione</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Agevolazione *</Label>
              <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {defs.map(d => <option key={d.type} value={d.type}>{d.label} ({d.percentage}%)</option>)}
              </Select>
            </div>
            {def && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{def.description}</p>
                <div className="bg-muted/40 p-3 rounded-lg space-y-1.5 text-xs">
                  <div><strong>Normativa:</strong> {def.normative}</div>
                  {def.validUntil && <div><strong>Valida fino:</strong> {def.validUntil}</div>}
                  <div><strong>Recupero in:</strong> {def.yearsRecovery} anni</div>
                  {def.maxAmount && <div><strong>Massimale:</strong> {formatCurrency(def.maxAmount)}</div>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dati pratica</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Cliente</Label>
              <Select value={form.customerId || ""} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">— Seleziona —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.companyName || c.name}</option>)}
              </Select>
            </div>
            <div><Label>Descrizione lavori *</Label><Textarea rows={3} required value={form.workDescription} onChange={e => setForm({ ...form, workDescription: e.target.value })} placeholder="Es. Rifacimento impianto elettrico appartamento Roma..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Inizio lavori</Label><Input type="date" value={form.workStartDate || ""} onChange={e => setForm({ ...form, workStartDate: e.target.value })} /></div>
              <div><Label>Fine lavori</Label><Input type="date" value={form.workEndDate || ""} onChange={e => setForm({ ...form, workEndDate: e.target.value })} /></div>
            </div>
            <div><Label>Importo totale lavori € *</Label><Input type="number" step="0.01" min="0" required value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: Number(e.target.value) })} /></div>
          </CardContent>
        </Card>
      </div>

      {def && form.totalAmount > 0 && (
        <Card className="mt-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900">
          <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-5 w-5" /> Calcolo detrazione</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div><div className="text-xs text-muted-foreground">Investimento</div><div className="font-display text-2xl font-bold">{formatCurrency(form.totalAmount)}</div></div>
              <div><div className="text-xs text-muted-foreground">Detrazione totale</div><div className="font-display text-2xl font-bold text-emerald-600">{formatCurrency(deductible)}</div></div>
              <div><div className="text-xs text-muted-foreground">Quota annua x {def.yearsRecovery}y</div><div className="font-display text-2xl font-bold text-primary">{formatCurrency(yearly)}</div></div>
            </div>
            {def.maxAmount && form.totalAmount > def.maxAmount && (
              <div className="mt-3 text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Massimale superato: detrazione calcolata su €{def.maxAmount}</div>
            )}
          </CardContent>
        </Card>
      )}

      {def && (
        <Card className="mt-4">
          <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5 text-sky-500" /> Documenti richiesti</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {def.required.documents.map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /><span>{d}</span></li>
              ))}
            </ul>
            <div className="grid md:grid-cols-2 gap-3 mt-4 text-xs">
              {def.required.bankTransfer && <Badge variant="warning">📄 Bonifico parlante richiesto</Badge>}
              {def.required.enéa && <Badge variant="warning">📡 Comunicazione ENEA {def.required.enéaWithinDays ? `entro ${def.required.enéaWithinDays} gg` : ""}</Badge>}
              {def.required.asseveration && <Badge variant="warning">🔧 Asseverazione tecnica richiesta</Badge>}
              {def.required.cessionAllowed ? <Badge variant="success">✓ Cessione/sconto ammessi</Badge> : <Badge variant="muted">✗ No cessione (dal 2024)</Badge>}
            </div>
            {def.required.invoiceMention && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs">
                <strong>Dicitura in fattura:</strong><br /><code className="text-amber-700 dark:text-amber-300">{def.required.invoiceMention}</code>
              </div>
            )}
            {def.required.bankTransferDescription && (
              <div className="mt-3 p-3 bg-sky-50 dark:bg-sky-950/30 rounded-lg text-xs">
                <strong>Causale bonifico parlante:</strong><br /><code className="text-sky-700 dark:text-sky-300 whitespace-pre-wrap">{def.required.bankTransferDescription}</code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {def && (
        <Card className="mt-4">
          <CardHeader><CardTitle>Modalità di fruizione</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-3 text-sm">
            <label className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="checkbox" checked={form.cessionAccredito} onChange={e => setForm({ ...form, cessionAccredito: e.target.checked })} disabled={!def.required.cessionAllowed} />
              <div>
                <div className="font-semibold">Cessione del credito</div>
                <div className="text-xs text-muted-foreground">A banca/istituto finanziario. {def.required.cessionAllowed ? "" : "Non ammessa per questa agevolazione dal 2024."}</div>
              </div>
            </label>
            <label className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="checkbox" checked={form.sconfoFattura} onChange={e => setForm({ ...form, sconfoFattura: e.target.checked })} disabled={!def.required.cessionAllowed} />
              <div>
                <div className="font-semibold">Sconto in fattura</div>
                <div className="text-xs text-muted-foreground">Sconto applicato dal fornitore (te stesso). {def.required.cessionAllowed ? "" : "Non ammesso per questa agevolazione dal 2024."}</div>
              </div>
            </label>
            <label className="flex items-start gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
              <input type="checkbox" checked={form.technicalAsseveration} onChange={e => setForm({ ...form, technicalAsseveration: e.target.checked })} />
              <div>
                <div className="font-semibold">Asseverazione tecnica</div>
                <div className="text-xs text-muted-foreground">Necessaria per Ecobonus, Sismabonus, Superbonus.</div>
              </div>
            </label>
          </CardContent>
        </Card>
      )}
    </form>
  );
}

export default function NewIncentivePage() { return <Suspense fallback={<div className="p-10"><Loader2 className="h-6 w-6 animate-spin" /></div>}><NewIncentiveForm /></Suspense>; }
