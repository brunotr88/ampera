"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function PrivacyDialog({ templates, initialType }: { templates: { type: string; title: string; audience: string }[]; initialType?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type: initialType || (templates[0]?.type ?? "CUSTOMER_INFORMATIVE") });

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { document } = await res.json();
      toast.success("Documento generato");
      setOpen(false);
      router.refresh();
      window.open(`/print/privacy/${document.id}?print=1`, "_blank");
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
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
  );
}
