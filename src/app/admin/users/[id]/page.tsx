import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tr } from "@/lib/labels";
import { formatDateTime, formatDate, formatCurrency } from "@/lib/utils";
import { User as UserIcon, Mail, Phone, Truck, Wrench, ClipboardList, Sun } from "lucide-react";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const user = await db.user.findFirst({
    where: { id, tenantId: s.tenantId },
  });
  if (!user) return notFound();

  const [workOrders, reports, vacations, vehicles, kpi] = await Promise.all([
    db.workOrder.findMany({
      where: { tenantId: s.tenantId, assignedToId: id, deletedAt: null },
      include: { customer: true, plant: true },
      orderBy: { scheduledDate: "desc" },
      take: 10,
    }),
    db.report.findMany({
      where: { tenantId: s.tenantId, technicianId: id, deletedAt: null },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.vacationRequest.findMany({
      where: { tenantId: s.tenantId, userId: id },
      orderBy: { startDate: "desc" },
      take: 5,
    }),
    db.vehicle.findMany({
      where: { tenantId: s.tenantId, assignedToId: id, deletedAt: null },
    }),
    Promise.all([
      db.workOrder.count({ where: { tenantId: s.tenantId, assignedToId: id, deletedAt: null } }),
      db.report.count({ where: { tenantId: s.tenantId, technicianId: id, deletedAt: null } }),
      db.report.aggregate({
        where: { tenantId: s.tenantId, technicianId: id, deletedAt: null, status: { in: ["SUBMITTED", "INVOICED"] } },
        _sum: { totalHours: true, totalAmount: true },
      }),
    ]),
  ]);

  const [totalWO, totalReports, sumKpi] = kpi;

  return (
    <div className="space-y-6">
      <PageHeader
        title={user.name}
        description={`${tr(user.role)} · ${user.email}`}
        back="/admin/settings"
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline"><Link href={`/admin/work-orders?f.technician=${user.id}`}><Wrench className="h-4 w-4" /> Interventi</Link></Button>
            <Button asChild variant="outline"><Link href={`/admin/reports?f.technician=${user.id}`}><ClipboardList className="h-4 w-4" /> Rapportini</Link></Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon className="h-4 w-4" /> Anagrafica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {user.email}</div>
            {user.phoneNumber && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {user.phoneNumber}</div>}
            <div><span className="text-muted-foreground">Ruolo:</span> <Badge variant="outline">{tr(user.role)}</Badge></div>
            <div><span className="text-muted-foreground">Stato:</span> <Badge variant={user.active ? "success" : "muted"}>{user.active ? "Attivo" : "Disattivato"}</Badge></div>
            {user.lastLoginAt && <div className="text-xs text-muted-foreground">Ultimo accesso: {formatDateTime(user.lastLoginAt)}</div>}
            <div className="text-xs text-muted-foreground">Creato: {formatDate(user.createdAt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistiche</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground">Interventi assegnati</div>
              <div className="font-display text-2xl font-bold">{totalWO}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Rapportini compilati</div>
              <div className="font-display text-2xl font-bold">{totalReports}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ore lavorate</div>
              <div className="font-display text-xl font-bold">{sumKpi._sum.totalHours?.toFixed(1) ?? "0"} h</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Valore generato</div>
              <div className="font-display text-xl font-bold text-emerald-600">{formatCurrency(sumKpi._sum.totalAmount || 0)}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> Veicoli assegnati</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {vehicles.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nessun veicolo assegnato.</p>
            ) : vehicles.map(v => (
              <Link key={v.id} href={`/admin/vehicles/${v.id}`} className="flex items-center justify-between p-2 -mx-2 rounded hover:bg-muted">
                <div>
                  <div className="font-mono font-semibold">{v.plate}</div>
                  <div className="text-xs text-muted-foreground">{v.brand} {v.model}</div>
                </div>
                <Badge variant="outline">{tr(v.type)}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Ultimi 10 interventi</CardTitle></CardHeader>
        <CardContent>
          {workOrders.length === 0 ? <p className="text-sm text-muted-foreground">Nessun intervento assegnato.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Codice</TableHead><TableHead>Titolo</TableHead><TableHead>Cliente</TableHead><TableHead>Programmato</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
              <TableBody>
                {workOrders.map(w => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs"><Link href={`/admin/work-orders/${w.id}`} className="hover:underline">{w.code}</Link></TableCell>
                    <TableCell>{w.title}</TableCell>
                    <TableCell><Link href={`/admin/customers/${w.customerId}`} className="hover:underline">{w.customer.companyName || w.customer.name}</Link></TableCell>
                    <TableCell className="text-xs">{w.scheduledDate ? formatDateTime(w.scheduledDate) : "—"}</TableCell>
                    <TableCell><Badge variant="muted">{tr(w.status)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ultimi 10 rapportini</CardTitle></CardHeader>
        <CardContent>
          {reports.length === 0 ? <p className="text-sm text-muted-foreground">Nessun rapportino compilato.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Codice</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead className="text-right">Ore</TableHead><TableHead className="text-right">Totale</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
              <TableBody>
                {reports.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs"><Link href={`/admin/reports/${r.id}`} className="hover:underline">{r.code}</Link></TableCell>
                    <TableCell><Link href={`/admin/customers/${r.customerId}`} className="hover:underline">{r.customer.companyName || r.customer.name}</Link></TableCell>
                    <TableCell className="text-xs">{formatDateTime(r.signedAt || r.endedAt || r.createdAt)}</TableCell>
                    <TableCell className="text-right">{r.totalHours?.toFixed(1) ?? "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(r.totalAmount)}</TableCell>
                    <TableCell><Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "INVOICED" ? "info" : "muted"}>{tr(r.status)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sun className="h-4 w-4" /> Ferie e permessi</CardTitle></CardHeader>
        <CardContent>
          {vacations.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna richiesta.</p> : (
            <ul className="divide-y divide-border">
              {vacations.map(v => (
                <li key={v.id} className="py-2 flex justify-between items-center text-sm">
                  <div>
                    <div>{formatDate(v.startDate)} → {formatDate(v.endDate)}</div>
                    <div className="text-xs text-muted-foreground">{v.reason || "—"}</div>
                  </div>
                  <Badge variant={v.status === "APPROVED" ? "success" : v.status === "PENDING" ? "warning" : "destructive"}>{tr(v.status)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
