import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatDateTime } from "@/lib/utils";

export default async function WODetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const wo = await db.workOrder.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { customer: true, plant: true, site: true, assignedTo: true, report: { include: { technician: true } } },
  });
  if (!wo) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`${wo.title}`} description={`#${wo.code} · ${wo.customer.companyName || wo.customer.name}`} back="/admin/work-orders"
        actions={wo.report ? <Button asChild><Link href={`/admin/reports/${wo.report.id}`}>Apri rapportino</Link></Button> : null} />
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Dettaglio</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><strong>Cliente:</strong> {wo.customer.companyName || wo.customer.name}</div>
            {wo.plant && <div><strong>Impianto:</strong> {wo.plant.name}</div>}
            {wo.scheduledDate && <div><strong>Quando:</strong> {formatDateTime(wo.scheduledDate)}</div>}
            <div><strong>Tecnico:</strong> {wo.assignedTo?.name || "Da assegnare"}</div>
            <div><strong>Priorità:</strong> <Badge variant={wo.priority === "EMERGENCY" ? "destructive" : "muted"}>{wo.priority}</Badge></div>
            <div><strong>Stato:</strong> <Badge variant="info">{wo.status}</Badge></div>
            {wo.description && <div className="whitespace-pre-wrap pt-2 border-t border-border">{wo.description}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Rapportino</CardTitle></CardHeader>
          <CardContent>
            {wo.report ? (
              <div className="text-sm">
                <div>#{wo.report.code}</div>
                <Badge variant={wo.report.status === "SUBMITTED" ? "success" : "muted"}>{wo.report.status}</Badge>
                <Button asChild className="mt-3 w-full" size="sm"><Link href={`/admin/reports/${wo.report.id}`}>Apri rapportino</Link></Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Il tecnico genererà il rapportino dall'app mobile a fine intervento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Attachments entityType="WorkOrder" entityId={wo.id} title="Allegati intervento" accept=".pdf,image/*" />
    </div>
  );
}
