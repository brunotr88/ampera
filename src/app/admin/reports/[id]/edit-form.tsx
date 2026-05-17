"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, X, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ReportEditForm({ report }: { report: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    workType: report.workType || "",
    cause: report.cause || "",
    description: report.description || "",
    recommendations: report.recommendations || "",
    totalHours: report.totalHours || 0,
    travelKm: report.travelKm || 0,
    contactPerson: report.contactPerson || "",
    signerName: report.signerName || "",
    totalLaborAmount: report.totalLaborAmount || 0,
    totalMaterialAmount: report.totalMaterialAmount || 0,
  });
  const [loading, setLoading] = useState(false);
  const [resendEmail, setResendEmail] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, resendEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      toast.success("Rapportino aggiornato");
      router.push(`/admin/reports/${report.id}`);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Modifica rapportino #{report.code}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Tipo intervento</Label><Input value={form.workType} onChange={e => setForm({ ...form, workType: e.target.value })} /></div>
          <div><Label>Causa</Label><Input value={form.cause} onChange={e => setForm({ ...form, cause: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Descrizione</Label><Textarea rows={5} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Raccomandazioni</Label><Textarea rows={3} value={form.recommendations} onChange={e => setForm({ ...form, recommendations: e.target.value })} /></div>
          <div><Label>Ore totali</Label><Input type="number" step="0.25" value={form.totalHours} onChange={e => setForm({ ...form, totalHours: Number(e.target.value) })} /></div>
          <div><Label>Km trasferta</Label><Input type="number" value={form.travelKm} onChange={e => setForm({ ...form, travelKm: Number(e.target.value) })} /></div>
          <div><Label>Manodopera €</Label><Input type="number" step="0.01" value={form.totalLaborAmount} onChange={e => setForm({ ...form, totalLaborAmount: Number(e.target.value) })} /></div>
          <div><Label>Materiali €</Label><Input type="number" step="0.01" value={form.totalMaterialAmount} onChange={e => setForm({ ...form, totalMaterialAmount: Number(e.target.value) })} /></div>
          <div><Label>Referente</Label><Input value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div><Label>Nome firmatario</Label><Input value={form.signerName} onChange={e => setForm({ ...form, signerName: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm pt-2 border-t">
          <input type="checkbox" checked={resendEmail} onChange={e => setResendEmail(e.target.checked)} />
          Reinvia email aggiornata al cliente
        </label>
        <div className="flex gap-2 pt-2">
          <Button onClick={save} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva modifiche</Button>
          <Button variant="outline" onClick={() => router.push(`/admin/reports/${report.id}`)}><X className="h-4 w-4" /> Annulla</Button>
        </div>
      </CardContent>
    </Card>
  );
}
