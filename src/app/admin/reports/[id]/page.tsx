import { notFound } from "next/navigation";
import { t } from "@/lib/labels";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Printer, Receipt, Mail, Edit, Send } from "lucide-react";
import { HELP } from "@/lib/page-help-data";
import { ReportEditForm } from "./edit-form";

export default async function ReportDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const r = await db.report.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { customer: true, plant: true, site: true, technician: true, timeEntries: { include: { user: true } }, materials: true, photos: true },
  });
  if (!r) return notFound();

  const editing = sp?.edit === "1" && !r.immutable;

  return (
    <div className="space-y-6">
      <PageHeader title={`Rapportino #${r.code}`} description={`${r.customer.companyName || r.customer.name} · ${r.technician.name}`} back="/admin/reports"
        help={HELP.reports}
        actions={
          <div className="flex gap-2 flex-wrap">
            {!r.immutable && !editing && <Button asChild variant="outline"><Link href={`/admin/reports/${r.id}?edit=1`}><Edit className="h-4 w-4" /> Modifica</Link></Button>}
            <Button asChild variant="outline"><Link href={`/print/report/${r.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa PDF</Link></Button>
            {r.status === "SUBMITTED" && !r.invoiceId && <Button asChild><Link href={`/admin/invoices/new?fromReport=${r.id}`}><Receipt className="h-4 w-4" /> Fattura</Link></Button>}
          </div>
        }
      />

      {editing ? <ReportEditForm report={JSON.parse(JSON.stringify(r))} /> : (
        <>
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Lavoro svolto</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-muted-foreground">Inizio:</span><br/>{formatDateTime(r.startedAt)}</div>
                  <div><span className="text-muted-foreground">Fine:</span><br/>{formatDateTime(r.endedAt)}</div>
                  <div><span className="text-muted-foreground">Ore totali:</span><br/>{r.totalHours?.toFixed(2) ?? "—"}</div>
                  <div><span className="text-muted-foreground">Km trasferta:</span><br/>{r.travelKm ?? "—"}</div>
                </div>
                {r.workType && <div><strong>Tipo:</strong> {r.workType}{r.cause ? ` · ${r.cause}` : ""}</div>}
                <div className="pt-3 border-t border-border">
                  <div className="font-semibold mb-1">Descrizione</div>
                  <div className="whitespace-pre-wrap">{r.description || "—"}</div>
                </div>
                {r.recommendations && (
                  <div className="pt-3 border-t border-border">
                    <div className="font-semibold mb-1">Raccomandazioni</div>
                    <div className="whitespace-pre-wrap">{r.recommendations}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Totali</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Manodopera</span><span>{formatCurrency(r.totalLaborAmount)}</span></div>
                <div className="flex justify-between"><span>Materiali</span><span>{formatCurrency(r.totalMaterialAmount)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border"><span>Totale</span><span className="text-primary">{formatCurrency(r.totalAmount)}</span></div>
                <div className="pt-3 flex flex-col gap-2 text-xs">
                  <div className="flex justify-between"><span>Stato:</span><Badge variant={r.status === "SUBMITTED" ? "success" : "muted"}>{t(r.status)}</Badge></div>
                  {r.signedAt && <div className="flex justify-between"><span>Firmato:</span><span>{formatDateTime(r.signedAt)}</span></div>}
                  {r.immutable && <div className="text-amber-600 flex items-center gap-1">🔒 Documento firmato, non modificabile</div>}
                  {r.customerEmailSent && <div className="flex items-center gap-1 text-emerald-600"><Mail className="h-3 w-3" /> Email inviata</div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {r.materials.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Materiali ({r.materials.length})</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide"><th className="pb-2">Codice</th><th>Descrizione</th><th className="text-right">Q.tà</th><th className="text-right">Prezzo</th><th className="text-right">Totale</th></tr></thead>
                  <tbody>{r.materials.map(m => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{m.code || "—"}</td>
                      <td>{m.description}</td>
                      <td className="text-right">{m.quantity} {m.unit}</td>
                      <td className="text-right">{formatCurrency(m.unitPrice)}</td>
                      <td className="text-right font-semibold">{formatCurrency(m.total)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {r.photos.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Foto cantiere ({r.photos.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {r.photos.map(p => (
                    <a key={p.id} href={p.url} target="_blank" className="block aspect-square rounded-lg overflow-hidden border lift">
                      <img src={p.url} alt={p.label || ""} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {r.signatureDataUrl && (
            <Card>
              <CardHeader><CardTitle>Firma cliente</CardTitle></CardHeader>
              <CardContent>
                <img src={r.signatureDataUrl} alt="firma" className="max-h-32 bg-white" />
                <div className="text-sm text-muted-foreground mt-2">{r.signerName} · {formatDateTime(r.signedAt)}</div>
              </CardContent>
            </Card>
          )}

          <Attachments entityType="Report" entityId={r.id} title="Allegati aggiuntivi" accept=".pdf,image/*" />
        </>
      )}
    </div>
  );
}
