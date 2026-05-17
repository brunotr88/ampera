"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: "" });
  const [adding, setAdding] = useState(false);

  function load() { fetch("/api/suppliers").then(r => r.json()).then(d => setSuppliers(d.suppliers || [])); }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ name: "" }); load(); toast.success("Fornitore creato"); }
    else toast.error("Errore");
    setAdding(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Fornitori" description={`${suppliers.length} fornitori`} back="/admin/purchase-orders" />
      <form onSubmit={add}>
        <Card>
          <CardContent className="p-5">
            <div className="grid md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2"><Label>Nome *</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Sonepar, Comoli Ferrari…" /></div>
              <div><Label>P.IVA</Label><Input value={form.vatNumber || ""} onChange={e => setForm({ ...form, vatNumber: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <Button type="submit" disabled={adding}><Plus className="h-4 w-4" /> Aggiungi</Button>
            </div>
          </CardContent>
        </Card>
      </form>
      <Table>
        <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>P.IVA</TableHead><TableHead>Contatti</TableHead><TableHead>Città</TableHead></TableRow></TableHeader>
        <TableBody>
          {suppliers.map(s => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.name}</TableCell>
              <TableCell className="font-mono text-xs">{s.vatNumber || "—"}</TableCell>
              <TableCell className="text-xs">{[s.email, s.phone].filter(Boolean).join(" · ") || "—"}</TableCell>
              <TableCell>{s.city || "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
