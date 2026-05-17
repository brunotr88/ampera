"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HELP } from "@/lib/page-help-data";
import { Shield, Plus, FileText, Printer, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function PrivacyPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type: "CUSTOMER_INFORMATIVE" });

  function load() {
    fetch("/api/privacy").then(r => r.json()).then(d => {
      setTemplates(d.templates || []);
      setDocs(d.documents || []);
    });
  }
  useEffect(load, []);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { document } = await res.json();
      toast.success("Documento generato");
      setOpen(false);
      load();
      window.open(`/print/privacy/${document.id}?print=1`, "_blank");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Privacy & GDPR" description="Informative conformi GDPR e consensi tracciati per clienti e operatori" help={HELP.privacy}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Genera documento</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuovo documento privacy</DialogTitle></DialogHeader>
              <form onSubmit={generate} className="space-y-3">
                <div>
                  <Label>Tipo documento</Label>
                  <Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    {templates.map(t => <option key={t.type} value={t.type}>{t.title} - {t.audience}</option>)}
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Nome interessato</Label><Input value={form.subjectName || ""} onChange={e => setForm({ ...form, subjectName: e.target.value })} placeholder="Mario Rossi" /></div>
                  <div><Label>CF interessato</Label><Input value={form.subjectFiscalCode || ""} onChange={e => setForm({ ...form, subjectFiscalCode: e.target.value })} maxLength={16} /></div>
                </div>
                <div><Label>Email interessato</Label><Input type="email" value={form.subjectEmail || ""} onChange={e => setForm({ ...form, subjectEmail: e.target.value })} /></div>
                <div><Label>Email DPO (opzionale)</Label><Input type="email" value={form.dpoEmail || ""} onChange={e => setForm({ ...form, dpoEmail: e.target.value })} placeholder="dpo@azienda.it" /></div>
                <Button type="submit" className="w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Genera e stampa</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div>
        <h2 className="font-display text-xl font-bold mb-3">Modelli disponibili</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(t => (
            <button key={t.type} onClick={() => { setForm({ type: t.type }); setOpen(true); }} className="text-left bg-card border border-border rounded-xl p-4 lift hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <Badge variant="muted" className="text-[10px]">{t.audience}</Badge>
              </div>
              <h3 className="font-semibold text-sm">{t.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{t.description}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t text-[10px] text-muted-foreground">
                {t.consentRequired ? <span className="text-amber-600">Consenso richiesto</span> : <span>Solo informativa</span>}
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-bold mb-3">Documenti generati ({docs.length})</h2>
        {docs.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2" />Nessun documento ancora generato.</CardContent></Card>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Interessato</TableHead><TableHead>Email</TableHead><TableHead>Pubblico</TableHead><TableHead>Generato</TableHead><TableHead>Stato</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {docs.map(d => (
                <TableRow key={d.id}>
                  <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                  <TableCell className="font-medium">{d.subjectName || "—"}</TableCell>
                  <TableCell className="text-xs">{d.subjectEmail || "—"}</TableCell>
                  <TableCell><Badge variant="muted">{d.audience}</Badge></TableCell>
                  <TableCell className="text-xs">{formatDate(d.createdAt)}</TableCell>
                  <TableCell><Badge variant={d.signedAt ? "success" : d.revokedAt ? "destructive" : "warning"}>{d.signedAt ? "Firmato" : d.revokedAt ? "Revocato" : "Non firmato"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/print/privacy/${d.id}?print=1`} target="_blank" className="text-muted-foreground hover:text-foreground"><Printer className="h-3.5 w-3.5" /></Link>
                      <Link href={`/admin/privacy/${d.id}`} className="text-primary text-xs font-semibold">Apri</Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
