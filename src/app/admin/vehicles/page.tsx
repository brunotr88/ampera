import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, daysUntil } from "@/lib/utils";
import { t } from "@/lib/labels";
import { Truck, Plus, AlertTriangle, ShieldCheck, Wrench, Calendar } from "lucide-react";

export default async function VehiclesPage() {
  const s = await requireSession();
  const vehicles = await db.vehicle.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { assignedTo: true },
    orderBy: { plate: "asc" },
  });

  const now = new Date();
  const expiringSoon = (d?: Date | null) => d && daysUntil(d) !== null && daysUntil(d)! < 60;
  const expired = (d?: Date | null) => d && daysUntil(d) !== null && daysUntil(d)! < 0;

  const insExpiring = vehicles.filter(v => expiringSoon(v.insuranceExpiry)).length;
  const insExpired = vehicles.filter(v => expired(v.insuranceExpiry)).length;
  const inspectionExpiring = vehicles.filter(v => expiringSoon(v.inspectionExpiry)).length;
  const maintExpiring = vehicles.filter(v => expiringSoon(v.maintenanceExpiry)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Flotta veicoli" description={`${vehicles.length} mezzi · ${insExpired} assicurazioni scadute · ${insExpiring} in scadenza`}
        actions={<Button asChild><Link href="/admin/vehicles/new"><Plus className="h-4 w-4" /> Nuovo veicolo</Link></Button>} />

      <div className="grid md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Totali</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{vehicles.length}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className={`text-sm flex items-center gap-2 ${insExpired > 0 ? "text-red-600" : "text-amber-600"}`}><ShieldCheck className="h-4 w-4" /> Assicurazione</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{insExpired + insExpiring}</div>
          <div className="text-xs text-muted-foreground">{insExpired} scaduti, {insExpiring} in scadenza</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-amber-600"><Calendar className="h-4 w-4" /> Revisione</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{inspectionExpiring}</div>
          <div className="text-xs text-muted-foreground">in scadenza 60 gg</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-blue-600"><Wrench className="h-4 w-4" /> Tagliando</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{maintExpiring}</div>
          <div className="text-xs text-muted-foreground">tagliandi in scadenza</div>
        </CardContent></Card>
      </div>

      {vehicles.length === 0 ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Nessun veicolo" description="Aggiungi furgoni, auto aziendali, mezzi: tracciamo km, scadenze assicurazione, revisione, tagliandi." cta={<Button asChild><Link href="/admin/vehicles/new">Nuovo veicolo</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Targa</TableHead><TableHead>Veicolo</TableHead><TableHead>Tipo</TableHead><TableHead>Assegnato</TableHead><TableHead className="text-right">Km</TableHead><TableHead>Assicur.</TableHead><TableHead>Revisione</TableHead><TableHead>Tagliando</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {vehicles.map(v => {
              const insD = daysUntil(v.insuranceExpiry);
              const inspD = daysUntil(v.inspectionExpiry);
              const maintD = daysUntil(v.maintenanceExpiry);
              return (
                <TableRow key={v.id}>
                  <TableCell><Link href={`/admin/vehicles/${v.id}`} className="font-mono font-semibold hover:underline">{v.plate}</Link></TableCell>
                  <TableCell><div className="text-sm">{v.brand} {v.model}</div>{v.year && <div className="text-xs text-muted-foreground">{v.year}</div>}</TableCell>
                  <TableCell><Badge variant="outline">{t(v.type)}</Badge></TableCell>
                  <TableCell className="text-sm">{v.assignedTo?.name || <span className="text-muted-foreground italic">—</span>}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{v.currentKm.toLocaleString("it-IT")}</TableCell>
                  <TableCell className="text-xs">
                    {v.insuranceExpiry ? <Badge variant={insD! < 0 ? "destructive" : insD! < 60 ? "warning" : "success"}>{formatDate(v.insuranceExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.inspectionExpiry ? <Badge variant={inspD! < 0 ? "destructive" : inspD! < 60 ? "warning" : "success"}>{formatDate(v.inspectionExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {v.maintenanceExpiry ? <Badge variant={maintD! < 0 ? "destructive" : maintD! < 60 ? "warning" : "muted"}>{formatDate(v.maintenanceExpiry)}</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell><Link href={`/admin/vehicles/${v.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
