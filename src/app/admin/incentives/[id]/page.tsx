import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INCENTIVES, generateBankTransferText } from "@/lib/incentives";
import { Printer, Copy, CheckCircle2 } from "lucide-react";

export default async function IncentiveDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const app = await db.incentiveApplication.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!app) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  const def = INCENTIVES.find(i => i.type === app.type);

  const bankText = def && tenant?.vatNumber ? generateBankTransferText({
    incentive: def,
    beneficiaryFiscalCode: app.notes || "[CF cliente]",
    companyVat: tenant.vatNumber,
    invoiceNumber: app.code,
  }) : "";

  return (
    <div className="space-y-6">
      <PageHeader title={`Pratica ${app.code}`} description={def?.label} back="/admin/incentives"
        actions={<Button asChild variant="outline"><Link href={`/print/incentive/${app.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa documentazione</Link></Button>} />

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Investimento</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-bold">{formatCurrency(app.totalAmount)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-emerald-600">Detrazione ({app.deductiblePercentage}%)</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-bold text-emerald-600">{formatCurrency(app.deductibleAmount)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Quota annua x {app.yearsOfRecovery}y</CardTitle></CardHeader><CardContent><div className="font-display text-2xl font-bold text-primary">{formatCurrency(app.yearlyAmount)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Dettagli pratica</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div><strong>Descrizione lavori:</strong><br/>{app.workDescription}</div>
          {app.workStartDate && <div><strong>Periodo lavori:</strong> {formatDate(app.workStartDate)} → {app.workEndDate ? formatDate(app.workEndDate) : "in corso"}</div>}
          <div className="pt-2 flex gap-2 flex-wrap">
            <Badge variant={app.status === "COMPLETED" ? "success" : "warning"}>{app.status}</Badge>
            {app.cessionAccredito && <Badge variant="info">Cessione credito</Badge>}
            {app.sconfoFattura && <Badge variant="info">Sconto fattura</Badge>}
            {app.technicalAsseveration && <Badge variant="info">Asseverazione</Badge>}
          </div>
        </CardContent>
      </Card>

      {def && bankText && (
        <Card>
          <CardHeader><CardTitle>📋 Bonifico parlante (causale da copiare)</CardTitle></CardHeader>
          <CardContent>
            <pre className="bg-muted/40 p-4 rounded-lg text-xs font-mono whitespace-pre-wrap select-all">{bankText}</pre>
            <p className="text-xs text-muted-foreground mt-2">Il cliente deve effettuare il bonifico al tuo conto inserendo esattamente questa causale (può essere abbreviata se troppo lunga ma deve contenere riferimento normativo, CF e P.IVA).</p>
          </CardContent>
        </Card>
      )}

      {def && (
        <Card>
          <CardHeader><CardTitle>Checklist documenti</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {def.required.documents.map((d, i) => (
                <li key={i} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /><span>{d}</span></li>
              ))}
            </ul>
            {def.required.invoiceMention && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                <div className="text-xs font-semibold mb-1">Dicitura obbligatoria nelle tue fatture:</div>
                <code className="text-xs text-amber-700 dark:text-amber-300 select-all">{def.required.invoiceMention}</code>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Attachments entityType="Tenant" entityId={app.id} title="Documenti pratica (bonifico, fatture, asseverazioni)" accept=".pdf,image/*" />
    </div>
  );
}
