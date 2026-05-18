import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, daysUntil } from "@/lib/utils";
import { Zap, Plus } from "lucide-react";

export default async function PlantsPage() {
  const s = await requireSession();
  const plants = await db.plant.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { customer: true, site: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader title="Impianti" description={`${plants.length} impianti gestiti`} actions={
        <Button asChild><Link href="/admin/plants/new"><Plus className="h-4 w-4" /> Nuovo impianto</Link></Button>
      } />

      {plants.length === 0 ? (
        <EmptyState icon={<Zap className="h-7 w-7" />} title="Nessun impianto" description="Gli impianti sono entità di prima classe: avrai storico interventi, DICO e scadenze DPR 462 per ognuno." cta={<Button asChild><Link href="/admin/plants/new"><Plus className="h-4 w-4" /> Aggiungi impianto</Link></Button>} />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Impianto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Potenza</TableHead>
              <TableHead>Installato</TableHead>
              <TableHead>Verifica</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plants.map(p => {
              const dleft = daysUntil(p.nextCheckDate);
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.code && <div className="text-xs text-muted-foreground font-mono">{p.code}</div>}
                  </TableCell>
                  <TableCell><Link href={`/admin/customers/${p.customer.id}`} className="hover:underline">{p.customer.companyName || `${p.customer.name} ${p.customer.surname || ""}`}</Link></TableCell>
                  <TableCell><Badge variant="outline">{tr(p.type)}</Badge></TableCell>
                  <TableCell className="text-right">{p.ratedPowerKw ? `${p.ratedPowerKw} kW` : "—"}</TableCell>
                  <TableCell>{p.installDate ? formatDate(p.installDate) : "—"}</TableCell>
                  <TableCell>
                    {p.nextCheckDate ? <Badge variant={dleft !== null && dleft < 30 ? "warning" : "muted"}>{formatDate(p.nextCheckDate)}</Badge> : "—"}
                  </TableCell>
                  <TableCell><Link href={`/admin/plants/${p.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
