"use client";
import { useEffect, useState } from "react";
import { t } from "@/lib/labels";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Plus, Save, Loader2, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ role: "TECHNICIAN" });
  const [saving, setSaving] = useState(false);

  function loadTenant() { fetch("/api/tenant").then(r => r.json()).then(d => setTenant(d.tenant)); }
  function loadUsers() { fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || [])); }
  useEffect(() => { loadTenant(); loadUsers(); }, []);

  async function saveTenant() {
    setSaving(true);
    const res = await fetch("/api/tenant", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tenant) });
    if (res.ok) toast.success("Impostazioni salvate"); else toast.error("Errore");
    setSaving(false);
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { toast.success("Utente creato"); setOpen(false); setForm({ role: "TECHNICIAN" }); loadUsers(); }
    else toast.error((await res.json()).error?.toString() || "Errore");
  }

  if (!tenant) return <div className="p-6 text-muted-foreground">Caricamento…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Impostazioni" description="Dati azienda, utenti e fatturazione" />

      <Card>
        <CardHeader><CardTitle>Dati azienda</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Ragione sociale</Label><Input value={tenant.name || ""} onChange={e => setTenant({ ...tenant, name: e.target.value })} /></div>
            <div><Label>P.IVA</Label><Input value={tenant.vatNumber || ""} onChange={e => setTenant({ ...tenant, vatNumber: e.target.value })} /></div>
            <div><Label>Codice Fiscale</Label><Input value={tenant.fiscalCode || ""} onChange={e => setTenant({ ...tenant, fiscalCode: e.target.value })} /></div>
            <div><Label>Codice SDI</Label><Input value={tenant.sdiCode || ""} onChange={e => setTenant({ ...tenant, sdiCode: e.target.value })} /></div>
            <div><Label>PEC</Label><Input value={tenant.pec || ""} onChange={e => setTenant({ ...tenant, pec: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={tenant.email || ""} onChange={e => setTenant({ ...tenant, email: e.target.value })} /></div>
            <div><Label>Telefono</Label><Input value={tenant.phone || ""} onChange={e => setTenant({ ...tenant, phone: e.target.value })} /></div>
            <div><Label>IBAN</Label><Input value={tenant.iban || ""} onChange={e => setTenant({ ...tenant, iban: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Indirizzo</Label><Input value={tenant.address || ""} onChange={e => setTenant({ ...tenant, address: e.target.value })} /></div>
            <div><Label>Città</Label><Input value={tenant.city || ""} onChange={e => setTenant({ ...tenant, city: e.target.value })} /></div>
            <div><Label>Provincia</Label><Input value={tenant.province || ""} onChange={e => setTenant({ ...tenant, province: e.target.value })} maxLength={2} /></div>
            <div><Label>CAP</Label><Input value={tenant.zip || ""} onChange={e => setTenant({ ...tenant, zip: e.target.value })} maxLength={5} /></div>
            <div><Label>IVA default %</Label><Input type="number" value={tenant.defaultVat || 22} onChange={e => setTenant({ ...tenant, defaultVat: Number(e.target.value) })} /></div>
            <div><Label>Margine default %</Label><Input type="number" value={tenant.defaultMargin || 30} onChange={e => setTenant({ ...tenant, defaultMargin: Number(e.target.value) })} /></div>
          </div>
          <Button onClick={saveTenant} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salva</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Utenti del workspace
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4" /> Nuovo utente</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuovo utente</DialogTitle></DialogHeader>
                <form onSubmit={addUser} className="space-y-3">
                  <div><Label>Nome *</Label><Input required value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Email *</Label><Input type="email" required value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                  <div><Label>Telefono</Label><Input value={form.phoneNumber || ""} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} /></div>
                  <div><Label>Ruolo</Label><Select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="OWNER">Owner</option><option value="ADMIN">Admin</option><option value="OFFICE">Ufficio</option><option value="TECHNICIAN">Tecnico</option><option value="VIEWER">Visualizzatore</option>
                  </Select></div>
                  <div><Label>Password temporanea *</Label><Input type="text" required minLength={10} value={form.password || ""} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
                  <Button type="submit" className="w-full">Crea utente</Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Ruolo</TableHead><TableHead>Telefono</TableHead><TableHead>Ultimo accesso</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell><Badge variant="outline">{t(u.role)}</Badge></TableCell>
                  <TableCell>{u.phoneNumber || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("it-IT") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Sicurezza & API</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>2FA TOTP: configurabile in {`/admin/security`} (in arrivo) - per ora cambiare password via /admin/profile.</p>
          <p>API Keys: gestibili da Admin Settings con scopes.</p>
        </CardContent>
      </Card>
    </div>
  );
}
