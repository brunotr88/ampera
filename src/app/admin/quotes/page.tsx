import Link from "next/link";
import { tr } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, Printer } from "lucide-react";

const STATUS_VARIANT: any = { DRAFT: "muted", SENT: "info", VIEWED: "info", ACCEPTED: "success", REJECTED: "destructive", EXPIRED: "muted", CONVERTED: "success" };

export default async function QuotesPage() {
  const s = await requireSession();
  const quotes = await db.quote.findMany({ where: { tenantId: s.tenantId, deletedAt: null }, include: { customer: true }, orderBy: { createdAt: "desc" }, take: 200 });

  return (
    <div>
      <PageHeader title="Preventivi" description={`${quotes.length} preventivi nel pipeline`} actions={<Button asChild><Link href="/admin/quotes/new"><Plus className="h-4 w-4" /> Nuovo preventivo</Link></Button>} />

      {quotes.length === 0 ? (
        <EmptyState icon={<FileText className="h-7 w-7" />} title="Nessun preventivo" description="Crea preventivi professionali, invia al cliente per firma digitale, converti in fattura." cta={<Button asChild><Link href="/admin/quotes/new">Nuovo preventivo</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Titolo</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead>Validità</TableHead><TableHead className="text-right">Totale</TableHead><TableHead>Stato</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {quotes.map(q => (
              <TableRow key={q.id}>
                <TableCell className="font-mono">{q.number}/v{q.version}</TableCell>
                <TableCell>{q.title}</TableCell>
                <TableCell>{q.customer.companyName || q.customer.name}</TableCell>
                <TableCell className="text-xs">{formatDate(q.createdAt)}</TableCell>
                <TableCell className="text-xs">{q.validUntil ? formatDate(q.validUntil) : "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(q.total)}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[q.status]}>{tr(q.status)}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/quotes/${q.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
                    <Link href={`/print/quote/${q.id}?print=1`} target="_blank" className="text-muted-foreground"><Printer className="h-3.5 w-3.5" /></Link>
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
