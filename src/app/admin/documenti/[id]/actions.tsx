"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import { Pen, Mail, Upload, Link as LinkIcon, Copy, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function DocumentActions({ doc, customer }: { doc: any; customer: any }) {
  const router = useRouter();
  const [shareUrl, setShareUrl] = useState<string | null>(doc.shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/sign/${doc.shareToken}` : null);

  if (doc.signedAt) {
    return (
      <Card>
        <CardHeader><CardTitle>Documento firmato</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-emerald-700"><CheckCircle2 className="h-4 w-4 inline" /> Firmato. Le azioni di firma non sono più disponibili.</p>
          <Button variant="outline" size="sm" onClick={async () => {
            if (!confirm("Revocare questo documento? L'azione è irreversibile.")) return;
            const reason = prompt("Motivo della revoca:");
            if (!reason) return;
            const res = await fetch(`/api/documents/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revoke: true, revokedReason: reason }) });
            if (res.ok) { toast.success("Revocato"); router.refresh(); } else toast.error("Errore");
          }}>Revoca documento</Button>
        </CardContent>
      </Card>
    );
  }

  async function shareGenerate() {
    const res = await fetch(`/api/documents/${doc.id}/share-token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ expiresDays: 30 }) });
    if (!res.ok) { toast.error("Errore"); return; }
    const { token } = await res.json();
    const url = `${window.location.origin}/sign/${token}`;
    setShareUrl(url);
    navigator.clipboard.writeText(url);
    toast.success("Link copiato negli appunti");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Firma documento</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        <TabletSignDialog docId={doc.id} defaultName={customer ? (customer.companyName || `${customer.name} ${customer.surname || ""}`) : ""} />
        <OtpSignDialog docId={doc.id} defaultEmail={customer?.email || ""} defaultName={customer ? (customer.companyName || `${customer.name} ${customer.surname || ""}`) : ""} />
        <UploadSignDialog docId={doc.id} defaultName={customer ? (customer.companyName || `${customer.name} ${customer.surname || ""}`) : ""} />

        <div className="pt-3 border-t mt-3">
          <Label className="text-xs">Link firma cliente</Label>
          {shareUrl ? (
            <div className="space-y-2">
              <div className="flex gap-1">
                <Input value={shareUrl} readOnly className="text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(shareUrl!); toast.success("Copiato"); }}><Copy className="h-3 w-3" /></Button>
              </div>
              <p className="text-xs text-muted-foreground">Inviabile al cliente: gli permette di firmare online senza login.</p>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={shareGenerate}><LinkIcon className="h-3 w-3" /> Genera link cliente</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TabletSignDialog({ docId, defaultName }: { docId: string; defaultName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!signature) { toast.error("Firma richiesta"); return; }
    if (!name) { toast.error("Nome richiesto"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedByName: name, signedByEmail: email, signatureDataUrl: signature }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato");
      setOpen(false);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full justify-start" variant="outline"><Pen className="h-4 w-4" /> Firma con tablet/touchpad</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Firma grafometrica</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome firmatario *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Email (opzionale)</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div>
            <Label>Firma *</Label>
            <SignaturePadComponent onSave={setSignature} />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pen className="h-4 w-4" />} Conferma firma
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OtpSignDialog({ docId, defaultEmail, defaultName }: { docId: string; defaultEmail: string; defaultName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"send" | "verify">("send");
  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOtp() {
    if (!email) { toast.error("Email richiesta"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/send-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success(`Codice inviato a ${email}`);
      setStep("verify");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  async function verifyOtp() {
    if (!otp || !name) { toast.error("Compila tutti i campi"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${docId}/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otp, signedByName: name, signedByEmail: email }) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato via OTP");
      setOpen(false); setStep("send"); setOtp("");
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full justify-start" variant="outline"><Mail className="h-4 w-4" /> Firma con OTP email</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Firma con codice OTP</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {step === "send" ? (
            <>
              <p className="text-sm text-muted-foreground">Verrà inviato un codice a 6 cifre alla email del cliente. Il cliente lo comunicherà per completare la firma.</p>
              <div><Label>Email cliente *</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <Button onClick={sendOtp} disabled={loading} className="w-full">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Invia codice
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-emerald-700">Codice inviato a {email}. Inserisci il codice ricevuto dal cliente.</p>
              <div><Label>Nome firmatario *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Codice OTP (6 cifre) *</Label><Input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} className="text-2xl tracking-widest text-center font-mono" maxLength={6} /></div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("send")}>← Indietro</Button>
                <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="flex-1">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Verifica e firma
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadSignDialog({ docId, defaultName }: { docId: string; defaultName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!file) { toast.error("File richiesto"); return; }
    if (!name) { toast.error("Nome richiesto"); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("signedByName", name);
      if (email) fd.append("signedByEmail", email);
      const res = await fetch(`/api/documents/${docId}/upload-signed`, { method: "POST", body: fd });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("PDF firmato caricato");
      setOpen(false);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button className="w-full justify-start" variant="outline"><Upload className="h-4 w-4" /> Carica PDF firmato</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload PDF firmato esternamente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Carica il PDF firmato manualmente, con firma digitale qualificata, o scansionato dopo firma a mano.</p>
          <div><Label>Nome firmatario *</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div><Label>Email (opzionale)</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><Label>PDF firmato *</Label><input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm" /></div>
          {file && <p className="text-xs text-muted-foreground">📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>}
          <Button onClick={submit} disabled={loading || !file} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Carica e firma
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
