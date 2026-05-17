"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Plus, Search, BookMarked } from "lucide-react";
import { toast } from "sonner";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ unit: "pz", vatRate: 22, marginPercent: 30, stockMin: 0, unitPrice: 0, purchasePrice: 0 });

  function load() { fetch(`/api/materials?q=${q}`).then(r => r.json()).then(d => setMaterials(d.materials || [])); }
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [q]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/materials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Articolo creato"); setOpen(false); setForm({ unit: "pz", vatRate: 22, marginPercent: 30, stockMin: 0 }); load(); }
    else toast.error("Errore");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Articoli" description={`${materials.length} articoli a catalogo`} actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4" /> Nuovo articolo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nuovo articolo</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Codice *</Label><Input required value={form.code || ""} onChange={e => setForm({ ...form, code: e.target.value })} /></div>
                <div><Label>Codice METEL</Label><Input value={form.metelCode || ""} onChange={e => setForm({ ...form, metelCode: e.target.value })} /></div>
              </div>
              <div><Label>Nome *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Marca</Label><Input value={form.brand || ""} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
                <div><Label>Categoria</Label><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div><Label>Barcode</Label><Input value={form.barcode || ""} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>UM</Label><Input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
                <div><Label>Prezzo vendita</Label><Input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: Number(e.target.value) })} /></div>
                <div><Label>Prezzo acquisto</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>IVA %</Label><Input type="number" value={form.vatRate} onChange={e => setForm({ ...form, vatRate: Number(e.target.value) })} /></div>
                <div><Label>Margine %</Label><Input type="number" value={form.marginPercent} onChange={e => setForm({ ...form, marginPercent: Number(e.target.value) })} /></div>
                <div><Label>Scorta min</Label><Input type="number" value={form.stockMin} onChange={e => setForm({ ...form, stockMin: Number(e.target.value) })} /></div>
              </div>
              <Button type="submit" className="w-full">Crea</Button>
            </form>
          </DialogContent>
        </Dialog>
      } />

      <Card><CardContent className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Cerca per codice, METEL, descrizione, marca…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
      </CardContent></Card>

      {materials.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><BookMarked className="h-10 w-10 mx-auto mb-2" />Nessun articolo</div>
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Codice</TableHead><TableHead>METEL</TableHead><TableHead>Nome</TableHead><TableHead>Marca</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Prezzo</TableHead><TableHead className="text-right">IVA</TableHead></TableRow></TableHeader>
          <TableBody>
            {materials.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-xs">{m.code}</TableCell>
                <TableCell className="font-mono text-xs">{m.metelCode || "—"}</TableCell>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell>{m.brand || "—"}</TableCell>
                <TableCell className="text-xs">{m.category || "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(m.unitPrice)}</TableCell>
                <TableCell className="text-right text-xs">{m.vatRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
