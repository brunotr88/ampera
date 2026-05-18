"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";

type PI = { id: string; number: string; series?: string | null; issueDate: string; total: number; supplierId: string; supplierName: string };

interface Props {
  value?: string | null;
  supplierId?: string | null;
  onChange: (next: { purchaseInvoiceId: string | null; invoiceRef: string | null; supplierId: string | null }) => void;
}

/** Picker autocomplete per PurchaseInvoice. Filtra anche per supplier se passato. */
export function PurchaseInvoicePicker({ value, supplierId, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PI[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PI | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (value && !selected) {
        try {
          const r = await fetch(`/api/purchase-invoices/${value}`);
          if (r.ok) {
            const d = await r.json();
            if (!aborted && d.invoice) {
              const inv = d.invoice;
              setSelected({
                id: inv.id, number: inv.number, series: inv.series,
                issueDate: inv.issueDate, total: inv.total,
                supplierId: inv.supplierId, supplierName: inv.supplier?.name || "",
              });
            }
          }
        } catch {}
      }
    }
    load();
    return () => { aborted = true; };
  }, [value]);

  useEffect(() => {
    if (!open) return;
    let aborted = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (supplierId) params.set("supplierId", supplierId);
        const r = await fetch(`/api/purchase-invoices?${params}`);
        if (r.ok) {
          const d = await r.json();
          if (!aborted) setResults((d.invoices || []).slice(0, 20));
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); aborted = true; };
  }, [query, supplierId, open]);

  function pick(p: PI) {
    setSelected(p);
    setOpen(false);
    setQuery("");
    onChange({
      purchaseInvoiceId: p.id,
      invoiceRef: `${p.number}${p.series ? "/" + p.series : ""} del ${new Date(p.issueDate).toLocaleDateString("it-IT")}`,
      supplierId: p.supplierId,
    });
  }

  function clear() {
    setSelected(null);
    setQuery("");
    onChange({ purchaseInvoiceId: null, invoiceRef: null, supplierId: null });
  }

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg">
        <div className="text-sm">
          <div className="font-medium">{selected.number}{selected.series ? `/${selected.series}` : ""}</div>
          <div className="text-xs text-muted-foreground">{selected.supplierName} · {new Date(selected.issueDate).toLocaleDateString("it-IT")} · {selected.total.toFixed(2)} €</div>
        </div>
        <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cerca fattura per numero o fornitore…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
      </div>
      {open && (results.length > 0 || loading) && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
          {loading ? (
            <div className="p-3 text-center text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline" /> Caricamento…</div>
          ) : results.map(p => (
            <button
              key={p.id} type="button" onClick={() => pick(p)}
              className="w-full text-left p-3 hover:bg-muted border-b last:border-0"
            >
              <div className="font-medium text-sm">{p.number}{p.series ? `/${p.series}` : ""}</div>
              <div className="text-xs text-muted-foreground">{p.supplierName} · {new Date(p.issueDate).toLocaleDateString("it-IT")} · {p.total.toFixed(2)} €</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
