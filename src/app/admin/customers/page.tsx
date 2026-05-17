import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Users, Plus, Mail, Phone } from "lucide-react";

export default async function CustomersPage() {
  const s = await requireSession();
  const customers = await db.customer.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { plants: true, projects: true, workOrders: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clienti"
        description={`${customers.length} clienti registrati`}
        actions={
          <Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Nuovo cliente</Link></Button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nessun cliente"
          description="Aggiungi il primo cliente per iniziare a creare preventivi, impianti e interventi."
          cta={<Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Aggiungi cliente</Link></Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>P.IVA / CF</TableHead>
              <TableHead>Contatti</TableHead>
              <TableHead className="text-right">Impianti</TableHead>
              <TableHead className="text-right">Commesse</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(c => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell>
                  <div className="font-medium">{c.companyName || `${c.name} ${c.surname || ""}`.trim()}</div>
                  {c.tags?.length > 0 && <div className="flex gap-1 mt-1">{c.tags.slice(0, 3).map(t => <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>)}</div>}
                </TableCell>
                <TableCell><Badge variant="outline">{c.type}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{c.vatNumber || c.fiscalCode || "—"}</TableCell>
                <TableCell className="text-xs space-y-0.5">
                  {c.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{c.email}</div>}
                  {c.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{c.phone}</div>}
                </TableCell>
                <TableCell className="text-right">{c._count.plants}</TableCell>
                <TableCell className="text-right">{c._count.projects}</TableCell>
                <TableCell><Badge variant={c.status === "ACTIVE" ? "success" : c.status === "BLOCKED" ? "destructive" : "muted"}>{c.status}</Badge></TableCell>
                <TableCell><Link href={`/admin/customers/${c.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
