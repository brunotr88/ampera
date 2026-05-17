import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatDate } from "@/lib/utils";
import { HELP } from "@/lib/page-help-data";
import { FileCheck, Wrench, ClipboardList } from "lucide-react";

export default async function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const plant = await db.plant.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: {
      customer: true, site: true, panels: true,
      reports: { take: 10, orderBy: { createdAt: "desc" }, include: { technician: true } },
      workOrders: { take: 10, orderBy: { scheduledDate: "desc" } },
      dicos: { take: 10, orderBy: { createdAt: "desc" } },
      periodicChecks: { orderBy: { dueDate: "asc" }, take: 10 },
      documents: { take: 10 },
    },
  });
  if (!plant) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={plant.name} description={`${plant.type} · Cliente: ${plant.customer.companyName || plant.customer.name}`} back="/admin/plants" help={HELP.plants}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href={`/admin/dico/new?plantId=${plant.id}`}><FileCheck className="h-4 w-4" /> Nuova DICO</Link></Button>
            <Button asChild size="sm"><Link href={`/admin/work-orders/new?plantId=${plant.id}&customerId=${plant.customerId}`}><Wrench className="h-4 w-4" /> Pianifica intervento</Link></Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Dati impianto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Tipo:</span> {plant.type}</div>
            {plant.code && <div><span className="text-muted-foreground">Codice:</span> {plant.code}</div>}
            {plant.ratedPowerKw && <div><span className="text-muted-foreground">Potenza:</span> {plant.ratedPowerKw} kW</div>}
            {plant.voltageV && <div><span className="text-muted-foreground">Tensione:</span> {plant.voltageV} V</div>}
            {plant.installDate && <div><span className="text-muted-foreground">Installato:</span> {formatDate(plant.installDate)}</div>}
            {plant.nextCheckDate && <Badge variant="warning">Verifica: {formatDate(plant.nextCheckDate)}</Badge>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Storico interventi</CardTitle></CardHeader>
          <CardContent>
            {plant.reports.length === 0 ? <p className="text-sm text-muted-foreground">Ancora nessun intervento.</p> : (
              <ul className="divide-y divide-border">
                {plant.reports.map(r => (
                  <li key={r.id} className="py-2 flex justify-between items-center">
                    <Link href={`/admin/reports/${r.id}`} className="flex items-center gap-2 hover:underline">
                      <ClipboardList className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">#{r.code}</span>
                      <span className="text-xs text-muted-foreground">{r.technician.name}</span>
                    </Link>
                    <Badge variant={r.status === "SUBMITTED" ? "success" : "muted"}>{r.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>DICO archiviate</CardTitle></CardHeader>
        <CardContent>
          {plant.dicos.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna DICO ancora generata.</p> : (
            <ul className="divide-y divide-border">
              {plant.dicos.map(d => (
                <li key={d.id} className="py-2 flex justify-between">
                  <div>
                    <div className="font-medium text-sm">#{d.number}</div>
                    <div className="text-xs text-muted-foreground">RT: {d.rtName || "—"}</div>
                  </div>
                  <Badge variant={d.status === "ISSUED" ? "success" : "muted"}>{d.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Attachments entityType="Plant" entityId={plant.id} title="Documenti tecnici (schemi, planimetrie, foto, DICO)" accept=".pdf,image/*,.dwg,.dxf" />
    </div>
  );
}
