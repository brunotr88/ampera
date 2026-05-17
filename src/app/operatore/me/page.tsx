"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, Sun, Settings as SettingsIcon, BarChart3, Truck } from "lucide-react";

export default function OperatoreMe() {
  const [vac, setVac] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/vacations?mine=1").then(r => r.json()).then(d => setVac(d.requests || []));
    fetch("/api/reports?mine=1").then(r => r.json()).then(d => setReports(d.reports || []));
  }, []);

  return (
    <div className="max-w-md mx-auto pb-20">
      <header className="px-5 pt-8 pb-5 gradient-mesh text-white rounded-b-3xl mb-4">
        <div className="text-xs text-white/70">PROFILO OPERATORE</div>
        <h1 className="font-display text-2xl font-bold mt-1">Io</h1>
      </header>

      <section className="px-5">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
          <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-ampera-700" />Statistiche</h2>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3">
              <div className="text-2xl font-bold">{reports.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Rapportini</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 rounded-lg p-3">
              <div className="text-2xl font-bold">{reports.reduce((s, r) => s + (r.totalHours || 0), 0).toFixed(1)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">Ore tot</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 mt-4 space-y-2">
        <Link href="/operatore/vacations" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
          <div className="flex items-center gap-3"><Sun className="h-5 w-5 text-amber-500" /><div><div className="font-medium">Ferie e Permessi</div><div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{vac.filter(v => v.status === "APPROVED").length} approvate</div></div></div>
          →
        </Link>
        <Link href="/admin/warehouse" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
          <div className="flex items-center gap-3"><Truck className="h-5 w-5 text-ampera-700" /><div className="font-medium">Furgone</div></div>
          →
        </Link>
        <Link href="/admin" className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border">
          <div className="flex items-center gap-3"><SettingsIcon className="h-5 w-5 text-slate-500 dark:text-slate-400 dark:text-slate-500" /><div className="font-medium">Pannello admin</div></div>
          →
        </Link>
      </section>

      <div className="px-5 mt-6">
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-destructive">
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </div>
    </div>
  );
}
