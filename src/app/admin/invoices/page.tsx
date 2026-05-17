import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Receipt, Plus, Printer, FileCode2 } from "lucide-react";

const PAY_VARIANT: any = { UNPAID: "warning", PARTIAL: "warning", PAID: "success", OVERDUE: "destructive", DISPUTED: "destructive" };

export default async function InvoicesPage() {
  const s = await requireSession();
  const invoices = await db.invoice.findMany({ where: { tenantId: s.tenantId, deletedAt: null }, include: { customer: true }, orderBy: { issueDate: "desc" }, take: 200 });

  const sumTotal = invoices.reduce((s, i) => s + i.total, 0);
  const sumUnpaid = invoices.reduce((s, i) => s + (i.paymentStatus !== "PAID" ? (i.total - i.amountPaid) : 0), 0);

  return (
    <div>
      <PageHeader title="Fatture" description={`${invoices.length} documenti · ${formatCurrency(sumTotal)} fatturato · ${formatCurrency(sumUnpaid)} da incassare`}
        actions={<Button asChild><Link href="/admin/invoices/new"><Plus className="h-4 w-4" /> Nuova fattura</Link></Button>} />

      {invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="h-7 w-7" />} title="Nessuna fattura" description="Genera fattura elettronica conforme SDI, scarica XML, traccia incassi." cta={<Button asChild><Link href="/admin/invoices/new">Nuova fattura</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Tipo</TableHead><TableHead>Cliente</TableHead><TableHead>Data</TableHead><TableHead>Scadenza</TableHead><TableHead className="text-right">Totale</TableHead><TableHead>SDI</TableHead><TableHead>Pagamento</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {invoices.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono">{inv.number}</TableCell>
                <TableCell><Badge variant="outline">{inv.type}</Badge></TableCell>
                <TableCell>{inv.customer.companyName || inv.customer.name}</TableCell>
                <TableCell className="text-xs">{formatDate(inv.issueDate)}</TableCell>
                <TableCell className="text-xs">{inv.dueDate ? formatDate(inv.dueDate) : "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(inv.total)}</TableCell>
                <TableCell><Badge variant={inv.sdiStatus === "ACCEPTED" || inv.sdiStatus === "DELIVERED" ? "success" : inv.sdiStatus === "REJECTED" ? "destructive" : "muted"}>{inv.sdiStatus}</Badge></TableCell>
                <TableCell><Badge variant={PAY_VARIANT[inv.paymentStatus]}>{inv.paymentStatus}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/admin/invoices/${inv.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link>
                    <Link href={`/print/invoice/${inv.id}?print=1`} target="_blank" className="text-muted-foreground"><Printer className="h-3.5 w-3.5" /></Link>
                    <Link href={`/api/invoices/${inv.id}/xml`} target="_blank" className="text-muted-foreground"><FileCode2 className="h-3.5 w-3.5" /></Link>
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
