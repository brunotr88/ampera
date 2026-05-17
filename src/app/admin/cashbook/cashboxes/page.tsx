"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function CashboxesPage() {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: "", type: "CASH", initialBalance: 0 });

  function load() { fetch("/api/cashboxes").then(r => r.json()).then(d => setBoxes(d.cashboxes || [])); }
  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/cashboxes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Cassa creata"); setForm({ name: "", type: "CASH", initialBalance: 0 }); load(); }
    else toast.error("Errore");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Casse e conti" description="Gestione cash flow multi-cassa" back="/admin/cashbook" />
      <div className="grid md:grid-cols-2 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="font-semibold mb-3">Esistenti</h3>
          {boxes.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna cassa.</p> : (
            <ul className="space-y-2">{boxes.map(b => (
              <li key={b.id} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <div><div className="font-medium">{b.name}</div><div className="text-xs text-muted-foreground">{b.type}</div></div>
                <div className="font-semibold text-primary">{formatCurrency(b.currentBalance)}</div>
              </li>
            ))}</ul>
          )}
        </CardContent></Card>
        <form onSubmit={add}>
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Nuova cassa</h3>
            <div><Label>Nome</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Cassa contanti / BPER" /></div>
            <div><Label>Tipo</Label><Select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="CASH">Contanti</option><option value="BANK">Banca</option><option value="CREDIT_CARD">Carta credito</option>
              <option value="POS">POS</option><option value="PAYPAL">PayPal</option><option value="STRIPE">Stripe</option><option value="OTHER">Altro</option>
            </Select></div>
            <div><Label>Saldo iniziale €</Label><Input type="number" step="0.01" value={form.initialBalance} onChange={e => setForm({ ...form, initialBalance: Number(e.target.value) })} /></div>
            <Button type="submit"><Plus className="h-4 w-4" /> Crea cassa</Button>
          </CardContent></Card>
        </form>
      </div>
    </div>
  );
}
