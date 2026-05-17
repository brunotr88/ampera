import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { Wrench, Plus } from "lucide-react";

const STATUS_VARIANT: any = { SCHEDULED: "info", IN_PROGRESS: "warning", PAUSED: "warning", COMPLETED: "success", CANCELLED: "muted", EMERGENCY: "destructive" };

export default async function WorkOrdersPage() {
  const s = await requireSession();
  const workOrders = await db.workOrder.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { customer: true, plant: true, assignedTo: true },
    orderBy: { scheduledDate: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Interventi" description={`${workOrders.length} interventi pianificati o conclusi`} actions={
        <Button asChild><Link href="/admin/work-orders/new"><Plus className="h-4 w-4" /> Nuovo intervento</Link></Button>
      } />

      {workOrders.length === 0 ? (
        <EmptyState icon={<Wrench className="h-7 w-7" />} title="Nessun intervento" description="Pianifica il primo intervento per assegnarlo a un tecnico." cta={<Button asChild><Link href="/admin/work-orders/new"><Plus className="h-4 w-4" /> Nuovo intervento</Link></Button>} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Titolo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Programmato</TableHead>
              <TableHead>Tecnico</TableHead>
              <TableHead>Priorità</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.map(w => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs">{w.code}</TableCell>
                <TableCell><div className="font-medium">{w.title}</div></TableCell>
                <TableCell>{w.customer.companyName || `${w.customer.name} ${w.customer.surname || ""}`}</TableCell>
                <TableCell className="text-xs">{w.scheduledDate ? formatDateTime(w.scheduledDate) : "—"}</TableCell>
                <TableCell>{w.assignedTo?.name || <span className="text-muted-foreground italic">Non assegnato</span>}</TableCell>
                <TableCell><Badge variant={w.priority === "EMERGENCY" ? "destructive" : w.priority === "URGENT" ? "warning" : "muted"}>{w.priority}</Badge></TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[w.status]}>{w.status}</Badge></TableCell>
                <TableCell><Link href={`/admin/work-orders/${w.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
