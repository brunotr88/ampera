"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [pref, setPref] = useState<any>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/users/me").then(r => r.json()).then(d => setMe(d.user));
    fetch("/api/users/preferences").then(r => r.json()).then(d => setPref(d.preferences));
  }, []);

  async function savePrefs() {
    setLoading(true);
    await fetch("/api/users/preferences", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pref) });
    toast.success("Preferenze salvate");
    setLoading(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.next !== pwd.confirm) return toast.error("Le password non coincidono");
    if (pwd.next.length < 10) return toast.error("Min 10 caratteri");
    setLoading(true);
    const res = await fetch("/api/users/password", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }) });
    if (res.ok) { toast.success("Password aggiornata"); setPwd({ current: "", next: "", confirm: "" }); }
    else toast.error((await res.json()).error || "Errore");
    setLoading(false);
  }

  if (!me) return <div className="p-6 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Il mio profilo" description={`${me.email} · ${me.role}`} />

      <Card>
        <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>Nome</Label><Input value={me.name} disabled /></div>
          <div><Label>Email</Label><Input value={me.email} disabled /></div>
          <div><Label>Ruolo</Label><Input value={me.role} disabled /></div>
          <div><Label>Telefono</Label><Input value={me.phoneNumber || ""} disabled /></div>
        </CardContent>
      </Card>

      {pref && (
        <Card>
          <CardHeader><CardTitle>Preferenze</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Email digest giornaliera</Label>
              <input type="checkbox" checked={pref.emailDigest} onChange={e => setPref({ ...pref, emailDigest: e.target.checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mostra suggerimenti automatici</Label>
              <input type="checkbox" checked={!pref.hideTips} onChange={e => setPref({ ...pref, hideTips: !e.target.checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Scorciatoie tastiera ⌘K</Label>
              <input type="checkbox" checked={pref.shortcutsEnabled} onChange={e => setPref({ ...pref, shortcutsEnabled: e.target.checked })} />
            </div>
            <Button onClick={savePrefs} disabled={loading}><Save className="h-4 w-4" /> Salva preferenze</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Cambia password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-3">
            <div><Label>Password attuale *</Label><div className="relative"><Input type={showPwd ? "text" : "password"} required value={pwd.current} onChange={e => setPwd({ ...pwd, current: e.target.value })} /><button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-2 top-2 text-muted-foreground">{showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <div><Label>Nuova password * (min 10 caratteri)</Label><Input type={showPwd ? "text" : "password"} required minLength={10} value={pwd.next} onChange={e => setPwd({ ...pwd, next: e.target.value })} /></div>
            <div><Label>Conferma nuova password *</Label><Input type={showPwd ? "text" : "password"} required value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></div>
            <Button type="submit" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Aggiorna password</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
