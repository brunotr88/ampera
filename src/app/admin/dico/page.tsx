import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { FileCheck, Plus } from "lucide-react";

export default async function DicoPage() {
  const s = await requireSession();
  const dicos = await db.conformityDeclaration.findMany({ where: { tenantId: s.tenantId }, include: { plant: { include: { customer: true } } }, orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader title="DICO - Dichiarazioni di Conformità" description={`${dicos.length} DICO archiviate (DM 37/08)`} actions={<Button asChild><Link href="/admin/dico/new"><Plus className="h-4 w-4" /> Nuova DICO</Link></Button>} />
      {dicos.length === 0 ? (
        <EmptyState icon={<FileCheck className="h-7 w-7" />} title="Nessuna DICO" description="Genera DICO conforme DM 37/08 con tutti gli allegati pre-spuntati per evitare DICO incomplete." />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Cliente</TableHead><TableHead>Impianto</TableHead><TableHead>RT</TableHead><TableHead>Data emissione</TableHead><TableHead>Stato</TableHead></TableRow></TableHeader>
          <TableBody>
            {dicos.map(d => (
              <TableRow key={d.id}>
                <TableCell className="font-mono">{d.number}</TableCell>
                <TableCell>{d.plant.customer.companyName || d.plant.customer.name}</TableCell>
                <TableCell>{d.plant.name}</TableCell>
                <TableCell className="text-xs">{d.rtName || "—"}</TableCell>
                <TableCell className="text-xs">{d.issueDate ? formatDate(d.issueDate) : "—"}</TableCell>
                <TableCell><Badge variant={d.status === "ISSUED" ? "success" : d.status === "SENT_TO_INAIL" ? "info" : "muted"}>{d.status}</Badge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
