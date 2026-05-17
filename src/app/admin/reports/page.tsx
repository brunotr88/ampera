import Link from "next/link";
import { t } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ClipboardList, Printer } from "lucide-react";

export default async function ReportsPage() {
  const s = await requireSession();
  const reports = await db.report.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { customer: true, plant: true, technician: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Rapportini" description={`${reports.length} rapportini compilati`} />

      {reports.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="Nessun rapportino" description="I tecnici creeranno i rapportini dall'app mobile (/operatore)." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Codice</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Impianto</TableHead>
              <TableHead>Tecnico</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ore</TableHead>
              <TableHead className="text-right">Totale</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell>{r.customer.companyName || r.customer.name}</TableCell>
                <TableCell>{r.plant?.name || "—"}</TableCell>
                <TableCell>{r.technician.name}</TableCell>
                <TableCell className="text-xs">{formatDateTime(r.signedAt || r.endedAt || r.createdAt)}</TableCell>
                <TableCell className="text-right">{r.totalHours?.toFixed(1) ?? "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(r.totalAmount)}</TableCell>
                <TableCell><Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "INVOICED" ? "info" : "muted"}>{t(r.status)}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/reports/${r.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
                    <Link href={`/print/report/${r.id}?print=1`} target="_blank" className="text-muted-foreground hover:text-foreground"><Printer className="h-3.5 w-3.5" /></Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
