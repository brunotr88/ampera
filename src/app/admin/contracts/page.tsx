import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { Truck, Plus } from "lucide-react";

export default async function ContractsPage() {
  const s = await requireSession();
  const contracts = await db.maintenanceContract.findMany({ where: { tenantId: s.tenantId }, include: { customer: true, plant: true }, orderBy: { nextDueDate: "asc" } });

  return (
    <div>
      <PageHeader title="Contratti manutenzione" description={`${contracts.length} contratti ricorrenti`} actions={<Button asChild><Link href="/admin/contracts/new"><Plus className="h-4 w-4" /> Nuovo</Link></Button>} />
      {contracts.length === 0 ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title="Nessun contratto" description="Genera ricavi ricorrenti: contratti di manutenzione con scadenze automatiche e fatturazione." />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Contratto</TableHead><TableHead>Cliente</TableHead><TableHead>Impianto</TableHead><TableHead>Prossima scadenza</TableHead><TableHead className="text-right">Canone mese</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
          <TableBody>
            {contracts.map(c => {
              const d = daysUntil(c.nextDueDate);
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.customer.companyName || c.customer.name}</TableCell>
                  <TableCell>{c.plant?.name || "—"}</TableCell>
                  <TableCell><Badge variant={d !== null && d <= 30 ? "warning" : "muted"}>{formatDate(c.nextDueDate)}</Badge></TableCell>
                  <TableCell className="text-right">{formatCurrency(c.feeMonthly)}</TableCell>
                  <TableCell><Badge variant={c.active ? "success" : "muted"}>{c.active ? "Attivo" : "Sospeso"}</Badge></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
