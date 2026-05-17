"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function OperatoreAll() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  useEffect(() => {
    setLoading(true);
    const q = filter === "open" ? "&status=IN_PROGRESS" : filter === "done" ? "&status=COMPLETED" : "";
    fetch(`/api/work-orders?mine=1${q}`).then(r => r.json()).then(d => { setItems(d.workOrders || []); setLoading(false); });
  }, [filter]);

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link href="/operatore" className="text-slate-500 dark:text-slate-400 dark:text-slate-500"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="font-display text-xl font-bold">Tutti gli interventi</h1>
        <div />
      </header>

      <div className="px-5 mb-3 flex gap-2">
        {[
          { v: "all", l: "Tutti" },
          { v: "open", l: "Aperti" },
          { v: "done", l: "Chiusi" },
        ].map(o => (
          <button key={o.v} onClick={() => setFilter(o.v as any)} className={`flex-1 py-2 rounded-lg text-sm font-medium ${filter === o.v ? "bg-ampera-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"}`}>{o.l}</button>
        ))}
      </div>

      <div className="px-5 space-y-3">
        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto my-10 text-ampera-700" /> : items.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400 dark:text-slate-500"><Calendar className="h-7 w-7 mx-auto mb-2" />Nessun intervento</div>
        ) : items.map(w => (
          <Link key={w.id} href={`/operatore/work-orders/${w.id}`} className="block bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{w.scheduledDate ? formatDate(w.scheduledDate) : "Non programmato"}</div>
            <div className="font-semibold">{w.customer.companyName || w.customer.name}</div>
            <div className="text-sm text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-1 line-clamp-2">{w.title}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{w.status}</span>
              <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
