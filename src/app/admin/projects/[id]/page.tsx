import { notFound } from "next/navigation";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const p = await db.project.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, workOrders: true, sals: true, stockMovements: { include: { material: true } } } });
  if (!p) return notFound();

  const consumedMat = p.stockMovements.filter(m => m.type === "OUT").reduce((s, m) => s + m.quantity * m.unitPrice, 0);
  const budgetTotal = p.budgetMaterials + p.budgetLabor + p.budgetIndirect;
  const matPercent = p.budgetMaterials ? (consumedMat / p.budgetMaterials) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader title={p.name} description={`#${p.code} · ${p.customer.companyName || p.customer.name}`} back="/admin/projects" />

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle>Budget</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{formatCurrency(budgetTotal)}</div>
          <div className="text-xs text-muted-foreground mt-1">Mat: {formatCurrency(p.budgetMaterials)} · MO: {formatCurrency(p.budgetLabor)} · Ind: {formatCurrency(p.budgetIndirect)}</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Consuntivo materiali</CardTitle></CardHeader><CardContent>
          <div className="text-2xl font-bold">{formatCurrency(consumedMat)}</div>
          <div className={`text-xs mt-1 ${matPercent > 100 ? "text-destructive" : matPercent > 80 ? "text-amber-600" : "text-muted-foreground"}`}>{matPercent.toFixed(1)}% del budget</div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle>Stato</CardTitle></CardHeader><CardContent>
          <Badge variant={p.status === "ACTIVE" ? "success" : "muted"}>{tr(p.status)}</Badge>
          <div className="text-xs text-muted-foreground mt-2">{p.startDate ? formatDate(p.startDate) : "—"} → {p.endDate ? formatDate(p.endDate) : "—"}</div>
        </CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Interventi associati ({p.workOrders.length})</CardTitle></CardHeader><CardContent>
        {p.workOrders.length === 0 ? <p className="text-sm text-muted-foreground">Nessun intervento ancora.</p> : <ul className="space-y-2">{p.workOrders.map(w => (
          <li key={w.id} className="flex justify-between text-sm">
            <span>{w.code} - {w.title}</span>
            <Badge variant="muted">{tr(w.status)}</Badge>
          </li>
        ))}</ul>}
      </CardContent></Card>
    </div>
  );
}
