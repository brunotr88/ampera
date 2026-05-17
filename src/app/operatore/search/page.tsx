"use client";
import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function OperatoreSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any>({ customers: [], plants: [], materials: [] });

  async function search(v: string) {
    if (v.length < 2) return setResults({ customers: [], plants: [], materials: [] });
    const [c, m] = await Promise.all([
      fetch(`/api/customers?q=${encodeURIComponent(v)}`).then(r => r.json()),
      fetch(`/api/materials?q=${encodeURIComponent(v)}`).then(r => r.json()),
    ]);
    setResults({ customers: c.customers?.slice(0, 10) || [], materials: m.materials?.slice(0, 10) || [], plants: [] });
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-3"><h1 className="font-display text-xl font-bold">Cerca</h1></header>
      <div className="px-5 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
          <Input className="pl-10 h-12 text-base" placeholder="Cliente, articolo, codice METEL…" value={q} onChange={e => { setQ(e.target.value); search(e.target.value); }} />
        </div>
      </div>

      <div className="px-5 space-y-4">
        {results.customers.length > 0 && (
          <section>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase mb-2">Clienti</div>
            {results.customers.map((c: any) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`} className="block bg-white dark:bg-slate-900 rounded-lg p-3 border mb-2">
                <div className="font-semibold">{c.companyName || `${c.name} ${c.surname || ""}`}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500">{c.vatNumber || c.fiscalCode || c.email}</div>
              </Link>
            ))}
          </section>
        )}
        {results.materials.length > 0 && (
          <section>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase mb-2">Articoli</div>
            {results.materials.map((m: any) => (
              <div key={m.id} className="bg-white dark:bg-slate-900 rounded-lg p-3 border mb-2">
                <div className="font-medium">{m.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 font-mono">{m.code} {m.metelCode && `· METEL ${m.metelCode}`}</div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
