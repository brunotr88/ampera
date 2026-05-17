import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HELP } from "@/lib/page-help-data";
import { INCENTIVES } from "@/lib/incentives";
import { Award, Plus, FileText, Building, Calendar, Info } from "lucide-react";

export default async function IncentivesPage() {
  const s = await requireSession();
  const apps = await db.incentiveApplication.findMany({
    where: { tenantId: s.tenantId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totalDeductible = apps.reduce((sum, a) => sum + a.deductibleAmount, 0);
  const totalSpent = apps.reduce((sum, a) => sum + a.totalAmount, 0);

  const categoriesMap: Record<string, string> = {
    edilizia: "🏠 Edilizia",
    energia: "🔋 Energia",
    sicurezza: "🛡️ Sicurezza",
    accessibilita: "♿ Accessibilità",
    mobilita: "🚗 Mobilità",
    fotovoltaico: "☀️ Fotovoltaico",
  };

  const byCategory = INCENTIVES.reduce<Record<string, typeof INCENTIVES>>((acc, i) => {
    (acc[i.category] = acc[i.category] || []).push(i);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader title="Agevolazioni Fiscali" description={`${apps.length} pratiche · ${formatCurrency(totalDeductible)} detraibili totali`}
        help={HELP.incentives}
        actions={<Button asChild><Link href="/admin/incentives/new"><Plus className="h-4 w-4" /> Nuova pratica</Link></Button>}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pratiche aperte</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{apps.filter(a => a.status !== "COMPLETED" && a.status !== "CANCELLED").length}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Investimento totale</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{formatCurrency(totalSpent)}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Detrazione totale</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold text-emerald-600">{formatCurrency(totalDeductible)}</div>
        </CardContent></Card>
      </div>

      {apps.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Pratiche in corso</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide"><th className="pb-2">Codice</th><th>Agevolazione</th><th>Descrizione</th><th className="text-right">Investimento</th><th className="text-right">Detrazione</th><th>Stato</th><th></th></tr></thead>
              <tbody>
                {apps.map(a => {
                  const def = INCENTIVES.find(i => i.type === a.type);
                  return (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{a.code}</td>
                      <td><Badge variant="info" className="whitespace-nowrap">{def?.label || a.type}</Badge></td>
                      <td className="max-w-xs truncate">{a.workDescription}</td>
                      <td className="text-right">{formatCurrency(a.totalAmount)}</td>
                      <td className="text-right font-semibold text-emerald-600">{formatCurrency(a.deductibleAmount)} ({a.deductiblePercentage}%)</td>
                      <td><Badge variant={a.status === "COMPLETED" ? "success" : a.status === "CANCELLED" ? "muted" : "warning"}>{a.status}</Badge></td>
                      <td><Link href={`/admin/incentives/${a.id}`} className="text-primary text-xs font-semibold">Apri</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="font-display text-xl font-bold mb-1">Agevolazioni disponibili in Italia</h2>
        <p className="text-sm text-muted-foreground mb-4">Tap su una scheda per avviare una pratica con compilazione assistita.</p>

        {Object.entries(byCategory).map(([cat, defs]) => (
          <div key={cat} className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{categoriesMap[cat] || cat}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {defs.map(d => (
                <Link key={d.type} href={`/admin/incentives/new?type=${d.type}`} className="block bg-card border border-border rounded-xl p-4 lift hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="default" className="bg-emerald-600">{d.percentage}%</Badge>
                    {d.validUntil && <span className="text-[10px] text-muted-foreground">Scad: {d.validUntil}</span>}
                  </div>
                  <h4 className="font-semibold text-sm">{d.label}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{d.description}</p>
                  <div className="flex items-center gap-3 mt-3 pt-2 border-t text-[11px] text-muted-foreground">
                    {d.maxAmount && <span>Max {formatCurrency(d.maxAmount)}</span>}
                    <span>{d.yearsRecovery}y recupero</span>
                    {d.required.enéa && <span className="text-amber-600">ENEA</span>}
                    {d.required.asseveration && <span className="text-amber-600">Asseverazione</span>}
                    {d.required.cessionAllowed && <span className="text-emerald-600">Cessione OK</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
