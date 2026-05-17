import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Building2, Plus } from "lucide-react";

export default async function ProjectsPage() {
  const s = await requireSession();
  const projects = await db.project.findMany({ where: { tenantId: s.tenantId, deletedAt: null }, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 100 });

  return (
    <div>
      <PageHeader title="Commesse" description={`${projects.length} commesse`} actions={<Button asChild><Link href="/admin/projects/new"><Plus className="h-4 w-4" /> Nuova commessa</Link></Button>} />
      {projects.length === 0 ? (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="Nessuna commessa" description="Organizza il lavoro per cantiere, traccia budget vs consuntivo, calcola marginalità." cta={<Button asChild><Link href="/admin/projects/new">Nuova commessa</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Codice</TableHead><TableHead>Nome</TableHead><TableHead>Cliente</TableHead><TableHead>Inizio</TableHead><TableHead className="text-right">Budget</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
          <TableBody>
            {projects.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.code}</TableCell>
                <TableCell><Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">{p.name}</Link></TableCell>
                <TableCell>{p.customer.companyName || p.customer.name}</TableCell>
                <TableCell className="text-xs">{p.startDate ? formatDate(p.startDate) : "—"}</TableCell>
                <TableCell className="text-right">{formatCurrency(p.budgetMaterials + p.budgetLabor + p.budgetIndirect)}</TableCell>
                <TableCell><Badge variant={p.status === "ACTIVE" ? "success" : p.status === "CLOSED" ? "muted" : "warning"}>{p.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
