"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"PRIVATE" | "BUSINESS" | "CONDOMINIUM" | "PUBLIC_ADMIN">("PRIVATE");
  const [form, setForm] = useState<any>({ status: "ACTIVE", gdprConsent: false, marketingConsent: false, tags: [], defaultDiscountPercent: 0 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Errore");
      }
      const { customer } = await res.json();
      toast.success("Cliente creato");
      router.push(`/admin/customers/${customer.id}`);
    } catch (e: any) {
      toast.error(e.message || "Errore");
    } finally {
      setLoading(false);
    }
  }

  const isBusiness = type === "BUSINESS" || type === "CONDOMINIUM" || type === "PUBLIC_ADMIN";

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto">
      <PageHeader title="Nuovo cliente" description="Anagrafica unica B2C/B2B." back="/admin/customers" actions={
        <Button type="submit" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvo…</> : <><Save className="h-4 w-4" /> Salva</>}</Button>
      } />

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex gap-2 flex-wrap">
            {[
              { v: "PRIVATE", l: "Privato" },
              { v: "BUSINESS", l: "Azienda" },
              { v: "CONDOMINIUM", l: "Condominio" },
              { v: "PUBLIC_ADMIN", l: "PA" },
            ].map(o => (
              <button key={o.v} type="button" onClick={() => setType(o.v as any)} className={`px-4 py-2 rounded-lg border text-sm font-medium ${type === o.v ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-accent"}`}>{o.l}</button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {isBusiness && (
              <div className="md:col-span-2">
                <Label>Ragione sociale *</Label>
                <Input required value={form.companyName || ""} onChange={e => setForm({ ...form, companyName: e.target.value, name: e.target.value })} />
              </div>
            )}
            {!isBusiness && (
              <>
                <div><Label>Nome *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>Cognome</Label><Input value={form.surname || ""} onChange={e => setForm({ ...form, surname: e.target.value })} /></div>
              </>
            )}
            <div><Label>P.IVA</Label><Input value={form.vatNumber || ""} onChange={e => setForm({ ...form, vatNumber: e.target.value })} placeholder="IT00000000000" /></div>
            <div><Label>Codice Fiscale</Label><Input value={form.fiscalCode || ""} onChange={e => setForm({ ...form, fiscalCode: e.target.value })} /></div>
            <div><Label>Codice SDI</Label><Input value={form.sdiCode || ""} onChange={e => setForm({ ...form, sdiCode: e.target.value })} placeholder="0000000" maxLength={7} /></div>
            <div><Label>PEC</Label><Input type="email" value={form.pec || ""} onChange={e => setForm({ ...form, pec: e.target.value })} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Cellulare</Label><Input value={form.mobile || ""} onChange={e => setForm({ ...form, mobile: e.target.value })} /></div>
            <div>
              <Label>Stato</Label>
              <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Attivo</option>
                <option value="PROSPECT">Prospect</option>
                <option value="INACTIVE">Inattivo</option>
                <option value="BLOCKED">Bloccato</option>
              </Select>
            </div>
            <div>
              <Label>Sconto default %</Label>
              <Input type="number" min="0" max="100" step="0.5" value={form.defaultDiscountPercent} onChange={e => setForm({ ...form, defaultDiscountPercent: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Note</Label>
              <Textarea rows={3} value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label>Tag (separati da virgola)</Label>
              <Input value={(form.tags || []).join(",")} onChange={e => setForm({ ...form, tags: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="VIP, ricorrente, moroso" />
            </div>
            <div className="md:col-span-2 flex flex-col gap-2 mt-2 p-4 bg-muted/30 rounded-lg">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.gdprConsent} onChange={e => setForm({ ...form, gdprConsent: e.target.checked })} /> Consenso trattamento dati (GDPR)</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.marketingConsent} onChange={e => setForm({ ...form, marketingConsent: e.target.checked })} /> Consenso comunicazioni marketing</label>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
