"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SignaturePadComponent } from "@/components/app/signature-pad";
import { tr } from "@/lib/labels";
import { formatDateTime } from "@/lib/utils";
import { Printer, Edit, FileSignature, X, Loader2, Trash2, Mail, RotateCcw, ExternalLink, Pencil, Save } from "lucide-react";
import { toast } from "sonner";

export default function PrivacyDocDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signing, setSigning] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState("");

  function load() {
    fetch(`/api/privacy/${id}`).then(r => r.json()).then(d => {
      setDoc(d.document);
      if (d.document) setEditForm({
        subjectName: d.document.subjectName || "",
        subjectEmail: d.document.subjectEmail || "",
        subjectFiscalCode: d.document.subjectFiscalCode || "",
        notes: d.document.notes || "",
        version: d.document.version,
        expiresAt: d.document.expiresAt ? new Date(d.document.expiresAt).toISOString().slice(0, 10) : "",
      });
    });
  }
  useEffect(() => { load(); }, [id]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/privacy/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editForm, expiresAt: editForm.expiresAt || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento aggiornato");
      setEditing(false); load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  }

  async function sign() {
    if (!signature) return toast.error("Firma obbligatoria");
    if (!signerName) return toast.error("Nome firmatario obbligatorio");
    setSigning(true);
    try {
      const res = await fetch(`/api/privacy/${id}/sign`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: signature, signerName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Documento firmato");
      setSignOpen(false); setSignature(null); setSignerName("");
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSigning(false); }
  }

  async function revoke() {
    if (!revokeReason) return toast.error("Motivo revoca obbligatorio");
    try {
      const res = await fetch(`/api/privacy/${id}/revoke`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revokeReason }),
      });
      if (!res.ok) throw new Error("Errore");
      toast.success("Documento revocato");
      setRevokeOpen(false); setRevokeReason("");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function remove() {
    if (!confirm("Eliminare definitivamente questo documento? L'azione e tracciata in audit log.")) return;
    const res = await fetch(`/api/privacy/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminato"); router.push("/admin/privacy"); }
  }

  if (!doc) return <div className="p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>;

  const status = doc.revokedAt ? "revoked" : doc.signedAt ? "signed" : "draft";
  const statusBadge = status === "revoked" ? <Badge variant="destructive">Revocato</Badge> : status === "signed" ? <Badge variant="success">Firmato</Badge> : <Badge variant="warning">Da firmare</Badge>;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title={tr(doc.type)} description={`v${doc.version} · ${doc.subjectName || "—"}`} back="/admin/privacy"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline"><Link href={`/print/privacy/${doc.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa</Link></Button>
            {status === "draft" && (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4" /> Modifica</Button>
                <Button onClick={() => setSignOpen(true)}><FileSignature className="h-4 w-4" /> Firma</Button>
              </>
            )}
            {status === "signed" && <Button variant="destructive" onClick={() => setRevokeOpen(true)}><RotateCcw className="h-4 w-4" /> Revoca</Button>}
            {status === "draft" && <Button variant="ghost" onClick={remove}><Trash2 className="h-4 w-4 text-red-500" /></Button>}
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Stato</CardTitle></CardHeader>
          <CardContent>
            {statusBadge}
            {doc.signedAt && <div className="text-xs text-muted-foreground mt-1">Firmato il {formatDateTime(doc.signedAt)}</div>}
            {doc.revokedAt && <div className="text-xs text-red-600 dark:text-red-400 mt-1">Revocato il {formatDateTime(doc.revokedAt)}{doc.revokedReason ? `: ${doc.revokedReason}` : ""}</div>}
            {doc.expiresAt && <div className="text-xs text-muted-foreground mt-1">Scade il {formatDateTime(doc.expiresAt)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Soggetto</CardTitle></CardHeader>
          <CardContent className="text-sm">
            <div className="font-medium">{doc.subjectName || "—"}</div>
            {doc.subjectEmail && <div className="text-xs text-muted-foreground"><Mail className="h-3 w-3 inline" /> {doc.subjectEmail}</div>}
            {doc.subjectFiscalCode && <div className="text-xs text-muted-foreground">CF: <span className="font-mono">{doc.subjectFiscalCode}</span></div>}
            <div className="flex gap-1 mt-2 flex-wrap">
              {doc.customerId && <Link href={`/admin/customers/${doc.customerId}`} className="text-xs text-primary hover:underline"><Badge variant="info"><ExternalLink className="h-2 w-2 mr-1" />Cliente</Badge></Link>}
              {doc.supplierId && <Link href={`/admin/suppliers`} className="text-xs text-primary hover:underline"><Badge variant="info"><ExternalLink className="h-2 w-2 mr-1" />Fornitore</Badge></Link>}
              {doc.userId && <Badge variant="info">Operatore</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tracciabilità</CardTitle></CardHeader>
          <CardContent className="text-xs space-y-1">
            <div><strong>Creato:</strong> {formatDateTime(doc.createdAt)}</div>
            <div><strong>Aggiornato:</strong> {formatDateTime(doc.updatedAt)}</div>
            {doc.ipAddress && <div><strong>IP firma:</strong> <span className="font-mono">{doc.ipAddress}</span></div>}
            {doc.userAgent && <div className="line-clamp-2"><strong>UA:</strong> <span className="text-muted-foreground">{doc.userAgent.substring(0, 60)}</span></div>}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle>Modifica metadati</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div><Label>Nome soggetto</Label><Input value={editForm.subjectName} onChange={e => setEditForm({ ...editForm, subjectName: e.target.value })} /></div>
            <div><Label>Email soggetto</Label><Input type="email" value={editForm.subjectEmail} onChange={e => setEditForm({ ...editForm, subjectEmail: e.target.value })} /></div>
            <div><Label>CF soggetto</Label><Input value={editForm.subjectFiscalCode} onChange={e => setEditForm({ ...editForm, subjectFiscalCode: e.target.value })} maxLength={16} /></div>
            <div><Label>Versione</Label><Input value={editForm.version} onChange={e => setEditForm({ ...editForm, version: e.target.value })} /></div>
            <div><Label>Scadenza</Label><Input type="date" value={editForm.expiresAt} onChange={e => setEditForm({ ...editForm, expiresAt: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Note interne</Label><Textarea rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
            <div className="md:col-span-2 flex gap-2">
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>
              <Button variant="outline" onClick={() => setEditing(false)}><X className="h-4 w-4" /> Annulla</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Anteprima documento</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/40 p-4 max-h-[60vh] overflow-y-auto">
            <iframe
              srcDoc={(doc.contentHtml || "").replace(/<script[^>]*>.*?<\/script>/gs, "")}
              className="w-full bg-white rounded-sm shadow-lg border-0"
              style={{ height: "55vh" }}
              sandbox=""
              title="Anteprima documento"
            />
          </div>
          {doc.signatureDataUrl && (
            <div className="mt-4 p-3 border rounded-lg bg-white">
              <div className="text-xs text-muted-foreground mb-1">Firma digitale acquisita:</div>
              <img src={doc.signatureDataUrl} alt="firma" className="max-h-24" />
              <div className="text-xs text-muted-foreground mt-1">{doc.signerName} · {formatDateTime(doc.signedAt)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sign dialog */}
      <Dialog open={signOpen} onOpenChange={setSignOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Firma documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Acquisisci la firma digitale. La firma viene salvata in modo sicuro insieme a data, ora, IP e user-agent.
            </div>
            <div><Label>Nome firmatario *</Label><Input value={signerName} onChange={e => setSignerName(e.target.value)} placeholder="Sig. Mario Rossi" autoFocus /></div>
            <div>
              <Label>Firma *</Label>
              {signature ? (
                <div className="border rounded-lg p-2 bg-white">
                  <img src={signature} alt="firma" className="max-h-32 mx-auto" />
                  <Button type="button" variant="outline" size="sm" className="w-full mt-2" onClick={() => setSignature(null)}><Pencil className="h-3 w-3" /> Rifirma</Button>
                </div>
              ) : (
                <SignaturePadComponent onSave={setSignature} height={180} />
              )}
            </div>
            <Button onClick={sign} disabled={signing || !signature || !signerName} className="w-full">
              {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />} Firma e archivia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke dialog */}
      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Revoca documento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded">
              ⚠ La revoca e tracciata in audit log e non puo essere annullata. Il documento resta archiviato ma marcato come "revocato".
            </div>
            <div><Label>Motivo revoca *</Label><Textarea rows={3} value={revokeReason} onChange={e => setRevokeReason(e.target.value)} placeholder="Es. Cliente ha revocato il consenso marketing in data..." /></div>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={revoke} disabled={!revokeReason}><RotateCcw className="h-4 w-4" /> Conferma revoca</Button>
              <Button variant="outline" onClick={() => setRevokeOpen(false)}>Annulla</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
