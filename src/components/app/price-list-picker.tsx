"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, X, Loader2 } from "lucide-react";

type Entry = {
  id: string; code: string; description: string; shortDescription?: string | null;
  chapter?: string | null; category?: string | null; unit: string; unitPrice: number;
  materialCost?: number | null; laborCost?: number | null;
};

interface Props {
  priceListId?: string | null;
  onPick: (e: Entry) => void;
  trigger?: React.ReactNode;
  buttonLabel?: string;
}

/**
 * Picker che apre un panel di ricerca FTS sul listino prezzi.
 * Su selezione chiama onPick con la voce scelta.
 */
export function PriceListPicker({ priceListId, onPick, trigger, buttonLabel = "Da prezzario" }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); return; }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let aborted = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (priceListId) params.set("priceListId", priceListId);
        const r = await fetch(`/api/price-list-entries?${params}`);
        if (r.ok) {
          const d = await r.json();
          if (!aborted) setResults(d.entries || []);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }, query ? 250 : 0);
    return () => { clearTimeout(t); aborted = true; };
  }, [query, priceListId, open]);

  function pick(e: Entry) {
    onPick(e);
    setOpen(false);
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <button
          type="button" onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-border hover:bg-muted"
        >
          <BookOpen className="h-3.5 w-3.5" /> {buttonLabel}
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 sm:p-12" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center gap-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Cerca per codice o descrizione (es: cavo 2,5 / quadro / fotovoltaico)…"
                className="border-0 focus-visible:ring-0 px-0 text-base"
              />
              <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  {query ? "Nessuna voce trovata. Prova un termine diverso." : "Inizia a digitare per cercare nel prezzario, oppure consulta tutte le voci."}
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {results.map(e => (
                    <li key={e.id}>
                      <button
                        type="button" onClick={() => pick(e)}
                        className="w-full text-left p-3 hover:bg-muted/60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-primary font-semibold">{e.code}</span>
                              {e.chapter && <span className="text-[10px] text-muted-foreground">Cap.{e.chapter}</span>}
                              {e.category && <span className="text-[10px] text-muted-foreground">· {e.category}</span>}
                            </div>
                            <div className="text-sm mt-0.5 line-clamp-2">{e.shortDescription || e.description}</div>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <div className="font-semibold">{e.unitPrice.toFixed(2)} €/{e.unit}</div>
                            {(e.materialCost != null || e.laborCost != null) && (
                              <div className="text-[10px] text-muted-foreground">
                                {e.materialCost != null && `Mat ${e.materialCost.toFixed(2)}`}
                                {e.laborCost != null && ` · Mdo ${e.laborCost.toFixed(2)}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="p-3 border-t text-xs text-muted-foreground bg-muted/30 flex items-center justify-between">
              <span>{results.length} risultati · ricerca su listino di default</span>
              <span>Esc per chiudere</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
