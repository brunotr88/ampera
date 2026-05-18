"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function SupplierForm() {
  const router = useRouter();
  const [form, setForm] = useState<any>({ name: "" });
  const [adding, setAdding] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ name: "" });
      toast.success("Fornitore creato");
      router.refresh();
    } else {
      toast.error("Errore");
    }
    setAdding(false);
  }

  return (
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
  );
}
