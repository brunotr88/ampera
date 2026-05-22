"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ImportCard({ priceListId }: { priceListId: string }) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    setCsv(text);
  }

  async function submit() {
    if (!csv.trim()) { toast.error("Nessun CSV"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/price-lists/${priceListId}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, sourceFile: fileName || "paste.csv" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore import");
      setResult(data);
      toast.success(`Importate: ${data.created} create, ${data.updated} aggiornate`);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  const sample = `code,chapter,category,description,unit,unitPrice,materialCost,laborCost,laborHours
01.A02.001,01,Cavi BT,"Cavo unipolare FS17 450/750V H07V-K sez. 1,5 mmq",ml,0.42,0.32,0.10,0.005
01.A02.002,01,Cavi BT,"Cavo unipolare FS17 450/750V H07V-K sez. 2,5 mmq",ml,0.65,0.50,0.15,0.007`;

  return (
    <Card id="import">
      <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4" /> Importa voci da CSV</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Colonne obbligatorie: <code>code</code>, <code>description</code>. Opzionali: <code>chapter, category, subCategory, shortDescription, unit, unitPrice, materialCost, laborCost, laborHours, laborRate, notes</code>.</p>
          <p>Separatore <code>,</code> o <code>;</code> auto-detect. Decimale <code>.</code> o <code>,</code>. Voci con stesso <code>code</code> vengono aggiornate (upsert).</p>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="block w-full text-sm" />
            {fileName && <p className="text-xs text-muted-foreground mt-1">📎 {fileName}</p>}
          </div>
          <Button onClick={submit} disabled={loading || !csv}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Importa
          </Button>
        </div>

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">Anteprima/Modifica CSV</summary>
          <Textarea
            rows={8} value={csv} onChange={e => setCsv(e.target.value)}
            placeholder={sample}
            className="font-mono text-xs mt-2"
          />
        </details>

        {result && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg text-sm">
            <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Import completato
            </div>
            <div className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
              {result.created} voci create · {result.updated} aggiornate · {result.skipped} saltate · totale listino: {result.total}
            </div>
            {result.errors?.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer text-amber-700 dark:text-amber-400">⚠ {result.errors.length} errori</summary>
                <ul className="text-xs mt-1 space-y-0.5">
                  {result.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
