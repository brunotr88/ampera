"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, MessageCircle, Package, Clock, ArrowRight, Receipt, Home } from "lucide-react";

function DoneInner() {
  const sp = useSearchParams();
  const reportId = sp.get("reportId");
  return (
    <div className="max-w-md mx-auto px-5 pt-10">
      <div className="text-center">
        <div className="h-24 w-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <h1 className="font-display text-3xl font-bold">Rapportino salvato!</h1>
        <p className="text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-2">Tutto è stato sincronizzato.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border p-5 mt-6 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-emerald-600"><Mail className="h-4 w-4" /> Email inviata al cliente</div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 dark:text-slate-500"><Package className="h-4 w-4" /> Materiali scaricati dal furgone</div>
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 dark:text-slate-500"><Clock className="h-4 w-4" /> Ore registrate</div>
      </div>

      <div className="mt-6 space-y-3">
        <Link href="/operatore" className="block w-full bg-ampera-700 text-white text-center rounded-xl py-4 font-semibold">Prossimo intervento <ArrowRight className="h-4 w-4 inline ml-1" /></Link>
        {reportId && <Link href={`/print/report/${reportId}?print=1`} target="_blank" className="block w-full bg-white dark:bg-slate-900 border text-center rounded-xl py-3 font-medium">📄 Apri PDF rapportino</Link>}
        <Link href="/operatore" className="block w-full text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 py-3"><Home className="h-4 w-4 inline" /> Torna alla home</Link>
      </div>
    </div>
  );
}

export default function DonePage() { return <Suspense><DoneInner /></Suspense>; }
