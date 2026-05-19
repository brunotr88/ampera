"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Zap, Wrench, FileText, Receipt, BadgeEuro, Calendar, Sun, BookMarked, ClipboardList, Building2, BookOpen, Settings, Award, Shield, Plus, Loader2 } from "lucide-react";

type Item = { id: string; title: string; sub?: string; href: string; icon: any; group: string };

const STATIC_NAV: Item[] = [
  { id: "dash", title: "Dashboard", href: "/admin", icon: Search, group: "Naviga" },
  { id: "cust", title: "Clienti", href: "/admin/customers", icon: Users, group: "Naviga" },
  { id: "plant", title: "Impianti", href: "/admin/plants", icon: Zap, group: "Naviga" },
  { id: "proj", title: "Commesse", href: "/admin/projects", icon: Building2, group: "Naviga" },
  { id: "wo", title: "Interventi", href: "/admin/work-orders", icon: Wrench, group: "Naviga" },
  { id: "rep", title: "Rapportini", href: "/admin/reports", icon: ClipboardList, group: "Naviga" },
  { id: "q", title: "Preventivi", href: "/admin/quotes", icon: FileText, group: "Naviga" },
  { id: "inv", title: "Fatture", href: "/admin/invoices", icon: Receipt, group: "Naviga" },
  { id: "cash", title: "Prima Nota", href: "/admin/cashbook", icon: BadgeEuro, group: "Naviga" },
  { id: "cal", title: "Calendario", href: "/admin/calendar", icon: Calendar, group: "Naviga" },
  { id: "vac", title: "Ferie & Permessi", href: "/admin/vacations", icon: Sun, group: "Naviga" },
  { id: "mat", title: "Articoli", href: "/admin/materials", icon: BookMarked, group: "Naviga" },
  { id: "inc", title: "Agevolazioni", href: "/admin/incentives", icon: Award, group: "Naviga" },
  { id: "prezz", title: "Prezzario DEI", href: "/admin/prezzario", icon: BookOpen, group: "Naviga" },
  { id: "priv", title: "Privacy & GDPR", href: "/admin/privacy", icon: Shield, group: "Naviga" },
  { id: "faq", title: "FAQ", href: "/admin/faq", icon: BookOpen, group: "Naviga" },
  { id: "set", title: "Impostazioni", href: "/admin/settings", icon: Settings, group: "Naviga" },

  { id: "newc", title: "+ Nuovo cliente", href: "/admin/customers/new", icon: Plus, group: "Crea" },
  { id: "newp", title: "+ Nuovo impianto", href: "/admin/plants/new", icon: Plus, group: "Crea" },
  { id: "neww", title: "+ Nuovo intervento", href: "/admin/work-orders/new", icon: Plus, group: "Crea" },
  { id: "newq", title: "+ Nuovo preventivo", href: "/admin/quotes/new", icon: Plus, group: "Crea" },
  { id: "newi", title: "+ Nuova fattura", href: "/admin/invoices/new", icon: Plus, group: "Crea" },
  { id: "newm", title: "+ Movimento prima nota", href: "/admin/cashbook/new", icon: Plus, group: "Crea" },
  { id: "newpo", title: "+ Ordine fornitore", href: "/admin/purchase-orders/new", icon: Plus, group: "Crea" },
  { id: "newinc", title: "+ Pratica agevolazione", href: "/admin/incentives/new", icon: Plus, group: "Crea" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    if (!open) { setQ(""); setResults([]); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setResults(STATIC_NAV.filter(n => n.title.toLowerCase().includes(q.toLowerCase())).slice(0, 20));
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const dynamicItems: Item[] = [
          ...(data.customers || []).map((c: any) => ({ id: `c-${c.id}`, title: c.companyName || `${c.name} ${c.surname || ""}`.trim(), sub: c.vatNumber || c.email, href: `/admin/customers/${c.id}`, icon: Users, group: "Clienti" })),
          ...(data.plants || []).map((p: any) => ({ id: `p-${p.id}`, title: p.name, sub: `${p.type} - ${p.customer?.companyName || p.customer?.name || ""}`, href: `/admin/plants/${p.id}`, icon: Zap, group: "Impianti" })),
          ...(data.reports || []).map((r: any) => ({ id: `r-${r.id}`, title: `Rapportino ${r.code}`, sub: r.customer?.companyName || r.customer?.name, href: `/admin/reports/${r.id}`, icon: ClipboardList, group: "Rapportini" })),
          ...(data.materials || []).map((m: any) => ({ id: `m-${m.id}`, title: m.name, sub: m.code, href: `/admin/materials?q=${encodeURIComponent(m.code)}`, icon: BookMarked, group: "Articoli" })),
        ];
        const filtered = STATIC_NAV.filter(n => n.title.toLowerCase().includes(q.toLowerCase()));
        setResults([...dynamicItems, ...filtered].slice(0, 40));
      } catch {}
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  function pick(item: Item) {
    router.push(item.href);
    setOpen(false);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) { e.preventDefault(); pick(results[selected]); }
  }

  if (!open) return null;
  const grouped = results.reduce<Record<string, Item[]>>((a, i) => { (a[i.group] = a[i.group] || []).push(i); return a; }, {});
  let runningIdx = 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[10vh] px-4" onClick={() => setOpen(false)}>
      <div className="w-full max-w-2xl bg-popover text-popover-foreground border border-border rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative border-b border-border">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSelected(0); }}
            onKeyDown={onInputKey}
            placeholder="Cerca clienti, impianti, rapportini, articoli, comandi…"
            className="w-full h-14 pl-12 pr-16 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />}
          <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 && q.length >= 2 && !loading && <div className="p-8 text-center text-sm text-muted-foreground">Nessun risultato per "{q}"</div>}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground bg-muted/30">{group}</div>
              {items.map(item => {
                const idx = runningIdx++;
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => pick(item)} onMouseEnter={() => setSelected(idx)} className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${selected === idx ? "bg-accent" : "hover:bg-accent/50"}`}>
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{item.title}</div>
                      {item.sub && <div className="text-xs text-muted-foreground truncate">{item.sub}</div>}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground flex justify-between">
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">↑↓</kbd> naviga · <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">↵</kbd> apri</span>
          <span><kbd className="bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd> apri/chiudi</span>
        </div>
      </div>
    </div>
  );
}
