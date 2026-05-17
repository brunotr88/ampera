"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const cb = sp.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showTotp, setShowTotp] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await signIn("credentials", { email, password, totp, redirect: false, callbackUrl: cb });
      if (res?.error) {
        setErr("Credenziali non valide o codice 2FA mancante.");
        setShowTotp(true);
      } else if (res?.ok) {
        // Determina dove reindirizzare in base al ruolo (ottenuto via /api/auth/session dopo signIn)
        try {
          const session = await fetch("/api/auth/session", { cache: "no-store" }).then(r => r.json());
          const role = session?.user?.role;
          let target = res.url || cb;
          if (role === "TECHNICIAN") target = "/operatore";
          else if (role === "CUSTOMER") target = "/portal";
          else if (cb === "/admin" || cb === "/") target = "/admin";
          router.push(target);
        } catch {
          router.push(res.url || cb);
        }
        router.refresh();
      }
    } catch {
      setErr("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Zap className="h-8 w-8 text-ampera-700 dark:text-ampera-400 fill-ampera-700/20 dark:fill-ampera-400/20" />
            <span className="font-display font-bold text-2xl text-ampera-800 dark:text-ampera-300">Ampera</span>
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">Accedi al tuo gestionale</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-ampera-700/5 dark:shadow-black/30 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="h-12" placeholder="email@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPwd ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="h-12 pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {showTotp && (
            <div>
              <Label htmlFor="totp">Codice 2FA</Label>
              <Input id="totp" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={totp} onChange={(e) => setTotp(e.target.value)} disabled={loading} className="h-12 text-center font-mono text-xl tracking-widest" placeholder="000000" />
            </div>
          )}
          {err && <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{err}</div>}
          <Button type="submit" size="lg" disabled={loading} className="w-full h-12 text-base bg-ampera-700 hover:bg-ampera-800">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifico…</> : "Accedi"}
          </Button>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            <Link href="/operatore" className="text-ampera-700 dark:text-ampera-400 hover:underline font-medium">Sei un tecnico? Apri area operatore →</Link>
          </div>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Ampera · ISIPC · v1.0
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-6 w-6 animate-spin text-ampera-700 dark:text-ampera-400" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
