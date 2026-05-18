import { notFound } from "next/navigation";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function ContractDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const c = await db.maintenanceContract.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { customer: true, plant: true },
  });
  if (!c) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={c.name} description={`Cliente: ${c.customer.companyName || c.customer.name}`} back="/admin/contracts" />
      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Frequenza</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">ogni {c.frequencyMonths} mesi</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Canone</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{formatCurrency(c.feeMonthly)}/mese</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Stato</CardTitle></CardHeader><CardContent>
          <Badge variant={c.active ? "success" : "muted"}>{c.active ? "Attivo" : "Sospeso"}</Badge>
          {c.autoInvoice && <Badge variant="info" className="ml-2">Auto-fattura</Badge>}
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Dettagli</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
        <div><strong>Periodo:</strong> {formatDate(c.startDate)} → {c.endDate ? formatDate(c.endDate) : "Senza fine"}</div>
        <div><strong>Prossima scadenza:</strong> {formatDate(c.nextDueDate)}</div>
        <div><strong>Notifica:</strong> {c.notifyDaysBefore} giorni prima</div>
        {c.plant && <div><strong>Impianto:</strong> {c.plant.name}</div>}
        {c.description && <div className="pt-2 border-t"><strong>Descrizione:</strong><br/>{c.description}</div>}
      </CardContent></Card>
    </div>
  );
}
