import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { Printer, FileSignature, AlertTriangle } from "lucide-react";
import { DocumentActions } from "./actions";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { template: true },
  });
  if (!doc) return notFound();

  const customer = doc.customerId ? await db.customer.findFirst({ where: { id: doc.customerId, tenantId: s.tenantId } }) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        description={`${doc.category.replace(/_/g, " ")} · Prot. ${doc.code}`}
        back="/admin/documenti"
        actions={
          <div className="flex gap-2 items-center">
            <Badge variant={doc.status === "SIGNED" ? "success" : doc.status === "REVOKED" ? "destructive" : doc.status === "SENT" ? "info" : "muted"}>{doc.status}</Badge>
            <Button asChild variant="outline" size="sm"><Link href={`/print/document/${doc.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa</Link></Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Contenuto documento</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted/40 p-4 max-h-[600px] overflow-y-auto">
                <div className="bg-white text-slate-900 shadow-lg rounded-sm mx-auto max-w-[210mm] p-8 [&_*]:!text-slate-900" dangerouslySetInnerHTML={{ __html: doc.contentHtml }} />
              </div>
            </CardContent>
          </Card>

          {doc.signedAt && (
            <Card className="border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/20">
              <CardHeader><CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400"><FileSignature className="h-4 w-4" /> Firmato</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><strong>Firmatario:</strong> {doc.signedByName}</div>
                {doc.signedByEmail && <div><strong>Email:</strong> {doc.signedByEmail}</div>}
                <div><strong>Data/ora:</strong> {formatDateTime(doc.signedAt)}</div>
                <div><strong>Modalità:</strong> <Badge variant="outline">{doc.signatureType}</Badge></div>
                {doc.signatureDataUrl && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Grafometrica:</div>
                    <img src={doc.signatureDataUrl} alt="firma" className="border bg-white max-h-32" />
                  </div>
                )}
                {doc.signatureFileUrl && (
                  <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900">
                    <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <Link href={doc.signatureFileUrl} target="_blank">📎 Apri PDF firmato (nuova scheda)</Link>
                    </Button>
                  </div>
                )}
                {doc.signatureMeta && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">Metadati firma (audit)</summary>
                    <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-x-auto">{doc.signatureMeta}</pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {doc.revokedAt && (
            <Card className="border-red-200 bg-red-50/40 dark:bg-red-950/20">
              <CardHeader><CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400"><AlertTriangle className="h-4 w-4" /> Documento revocato</CardTitle></CardHeader>
              <CardContent className="text-sm">
                <div><strong>Data:</strong> {formatDateTime(doc.revokedAt)}</div>
                {doc.revokedReason && <div><strong>Motivo:</strong> {doc.revokedReason}</div>}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Riferimenti</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><strong>Codice:</strong> <span className="font-mono">{doc.code}</span></div>
              <div><strong>Creato:</strong> {formatDateTime(doc.createdAt)}</div>
              {doc.template?.legalReference && <div><strong>Norma:</strong> <span className="text-xs">{doc.template.legalReference}</span></div>}
              {customer && (
                <div><strong>Cliente:</strong> <Link href={`/admin/customers/${customer.id}`} className="hover:underline">{customer.companyName || `${customer.name} ${customer.surname || ""}`}</Link></div>
              )}
              {doc.plantId && <div><strong>Impianto:</strong> <Link href={`/admin/plants/${doc.plantId}`} className="hover:underline">vai →</Link></div>}
              {doc.workOrderId && <div><strong>Intervento:</strong> <Link href={`/admin/work-orders/${doc.workOrderId}`} className="hover:underline">vai →</Link></div>}
              {doc.sentTo && <div><strong>Inviato a:</strong> {doc.sentTo}{doc.sentAt && <span className="text-muted-foreground text-xs"> ({formatDateTime(doc.sentAt)})</span>}</div>}
            </CardContent>
          </Card>

          <DocumentActions doc={JSON.parse(JSON.stringify(doc))} customer={customer ? JSON.parse(JSON.stringify(customer)) : null} />
        </div>
      </div>
    </div>
  );
}
