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

export default function NewPriceListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    name: "DEI Impianti Elettrici",
    source: "DEI",
    year: new Date().getFullYear(),
    active: true,
    isDefault: false,
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/price-lists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error((await res.json()).error || "Errore");
      const { list } = await res.json();
      toast.success("Listino creato");
      router.push(`/admin/prezzario/${list.id}`);
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl mx-auto">
      <PageHeader title="Nuovo listino prezzi" back="/admin/prezzario"
        actions={<Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Crea</Button>} />
      <Card><CardContent className="p-6 space-y-4">
        <div><Label>Nome listino *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="DEI Impianti Elettrici 2025" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Fonte</Label>
            <Select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
              <option value="DEI">DEI - Tipografia Genio Civile</option>
              <option value="REGIONALE">Prezzario Regionale</option>
              <option value="ANAS">ANAS</option>
              <option value="INTERNO">Listino interno aziendale</option>
              <option value="ALTRO">Altro</option>
            </Select>
          </div>
          <div><Label>Anno *</Label><Input type="number" required min="2000" max="2099" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} /></div>
        </div>
        <div><Label>Descrizione</Label><Textarea rows={2} value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Note interne sul listino, riferimento normativo, area geografica…" /></div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
            Listino attivo (selezionabile nei preventivi)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
            Imposta come listino di default (sarà preselezionato nei nuovi preventivi)
          </label>
        </div>
        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          Dopo la creazione potrai importare le voci via CSV o aggiungerle manualmente.
          Le voci con codifica DEI tipica: <code>01.A02.B03.005</code> con descrizione, UM (ml, pz, h, mq), prezzo unitario e scomposizione (materiale + manodopera).
        </p>
      </CardContent></Card>
    </form>
  );
}
