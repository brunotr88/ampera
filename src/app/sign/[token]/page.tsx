"use client";
import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import { CheckCircle2, FileSignature, Pen, Mail, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function PublicSignPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [doc, setDoc] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"choose" | "tablet" | "otp">("choose");
  const [otpStep, setOtpStep] = useState<"send" | "verify">("send");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/public/documents/${token}`).then(async r => {
      if (!r.ok) { setError((await r.json()).error || "Errore"); return; }
      const d = await r.json();
      setDoc(d.document);
    });
  }, [token]);

  async function submitTablet() {
    if (!signature || !name) { toast.error("Firma e nome richiesti"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/public/documents/${token}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "tablet", signatureDataUrl: signature, signedByName: name, signedByEmail: email }) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato!");
      setDoc({ ...doc, signedAt: new Date(), signedByName: name, signatureType: "TABLET" });
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function sendOtp() {
    if (!email) { toast.error("Email richiesta"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/public/documents/${token}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send-otp", email }) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success(`Codice inviato a ${email}`);
      setOtpStep("verify");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }
  async function verifyOtp() {
    if (!otp || !name) { toast.error("Compila tutti i campi"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/public/documents/${token}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "verify-otp", otp, signedByName: name, signedByEmail: email }) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato!");
      setDoc({ ...doc, signedAt: new Date(), signedByName: name, signatureType: "OTP" });
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-10 w-10 mx-auto text-amber-600 mb-3" />
            <h1 className="font-display text-xl font-bold mb-2">Documento non disponibile</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doc) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="text-center">
          <FileSignature className="h-10 w-10 mx-auto text-primary mb-2" />
          <h1 className="font-display text-2xl font-bold">{doc.title}</h1>
          <p className="text-sm text-muted-foreground">Prot. {doc.code}</p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Contenuto del documento</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-white text-black border rounded-lg p-6 max-h-[500px] overflow-y-auto" dangerouslySetInnerHTML={{ __html: doc.contentHtml }} />
          </CardContent>
        </Card>

        {doc.signedAt ? (
          <Card className="border-emerald-300 bg-emerald-50">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600 mb-2" />
              <h2 className="font-display text-xl font-bold text-emerald-700">Documento firmato</h2>
              <p className="text-sm text-emerald-700 mt-1">Grazie {doc.signedByName}. Hai firmato il documento il {new Date(doc.signedAt).toLocaleString("it-IT")}.</p>
            </CardContent>
          </Card>
        ) : mode === "choose" ? (
          <Card>
            <CardHeader><CardTitle>Scegli modalità di firma</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setMode("tablet")} variant="outline" className="w-full justify-start"><Pen className="h-4 w-4" /> Firma direttamente qui (tablet o mouse)</Button>
              <Button onClick={() => setMode("otp")} variant="outline" className="w-full justify-start"><Mail className="h-4 w-4" /> Firma con codice OTP via email</Button>
            </CardContent>
          </Card>
        ) : mode === "tablet" ? (
          <Card>
            <CardHeader><CardTitle>Firma grafometrica</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Il tuo nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Email (opzionale)</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div>
                <Label>Disegna la tua firma *</Label>
                <SignaturePadComponent onSave={setSignature} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode("choose")}>← Indietro</Button>
                <Button onClick={submitTablet} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pen className="h-4 w-4" />} Firma documento
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Firma con codice OTP</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {otpStep === "send" ? (
                <>
                  <p className="text-sm text-muted-foreground">Riceverai un codice a 6 cifre all'indirizzo email che indichi.</p>
                  <div><Label>La tua email *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setMode("choose")}>← Indietro</Button>
                    <Button onClick={sendOtp} disabled={loading} className="flex-1">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Invia codice
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-emerald-700">Codice inviato a {email}. Controlla la tua casella (anche spam).</p>
                  <div><Label>Il tuo nome *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
                  <div><Label>Codice OTP (6 cifre) *</Label><Input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-3xl tracking-widest text-center font-mono" maxLength={6} /></div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setOtpStep("send")}>← Rinvia</Button>
                    <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="flex-1">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Conferma e firma
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          Sistema di firma elettronica · L'IP e il timestamp vengono registrati per validità legale.
        </p>
      </div>
    </div>
  );
}
