"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link as LinkIcon, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function WorkOrderTrackingCard({ workOrderId, initialHash, initialCustomStateId }: { workOrderId: string; initialHash?: string | null; initialCustomStateId?: string | null }) {
  const [hash, setHash] = useState<string | null>(initialHash || null);
  const [states, setStates] = useState<any[]>([]);
  const [currentStateId, setCurrentStateId] = useState<string | null>(initialCustomStateId || null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/workflow-states?scope=WORKORDER").then(r => r.json()).then(d => setStates(d.states || []));
  }, []);

  const trackingUrl = hash ? `${typeof window !== "undefined" ? window.location.origin : ""}/track/${hash}` : null;

  async function generateHash() {
    setBusy(true);
    try {
      const r = await fetch(`/api/work-orders/${workOrderId}/tracking-hash`, { method: "POST" });
      if (!r.ok) throw new Error("Errore");
      const d = await r.json();
      setHash(d.trackingHash);
      const url = `${window.location.origin}/track/${d.trackingHash}`;
      try { await navigator.clipboard.writeText(url); toast.success("Link generato e copiato"); }
      catch { toast.success("Link generato"); }
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function revokeHash() {
    if (!confirm("Revocare il link di tracking? Il cliente non potrà più accedere.")) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/work-orders/${workOrderId}/tracking-hash`, { method: "DELETE" });
      if (!r.ok) throw new Error("Errore");
      setHash(null);
      toast.success("Link revocato");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  async function updateCustomState(stateId: string) {
    setBusy(true);
    try {
      const r = await fetch(`/api/work-orders/${workOrderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customStateId: stateId || null }),
      });
      if (!r.ok) throw new Error("Errore");
      setCurrentStateId(stateId || null);
      toast.success("Stato aggiornato");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  }

  const currentState = states.find(s => s.id === currentStateId);

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Tracking cliente</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {/* Stato workflow custom */}
        <div>
          <Label className="text-xs">Stato workflow corrente</Label>
          <div className="flex gap-2 items-center mt-1">
            {currentState && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: currentState.color }} />}
            <Select value={currentStateId || ""} onChange={e => updateCustomState(e.target.value)} disabled={busy} className="flex-1">
              <option value="">— Usa stato base ({"{"}{status}{"}"}) —</option>
              {states.filter(s => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.percentage}%){s.triggersClientEmail ? " · 📧" : ""}</option>
              ))}
            </Select>
          </div>
          {currentState && <p className="text-xs text-muted-foreground mt-1">{currentState.description}</p>}
        </div>

        {/* Link tracking */}
        <div className="pt-3 border-t border-border">
          {hash ? (
            <div className="space-y-2">
              <Label className="text-xs">Link tracking attivo</Label>
              <div className="flex gap-1">
                <Input value={trackingUrl!} readOnly className="font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(trackingUrl!); toast.success("Copiato"); }}><Copy className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" asChild><a href={trackingUrl!} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3" /></a></Button>
              </div>
              <p className="text-xs text-muted-foreground">Il cliente può vedere lo stato dell'intervento via questo link, senza login.</p>
              <Button size="sm" variant="destructive" onClick={revokeHash} disabled={busy}>
                <Trash2 className="h-3 w-3" /> Revoca link
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Genera un link sicuro per permettere al cliente di vedere lo stato dell'intervento in tempo reale (no login).</p>
              <Button onClick={generateHash} disabled={busy} className="w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />} Genera link tracking
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
