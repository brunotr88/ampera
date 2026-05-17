import Link from "next/link";
import { t } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ShoppingCart, Plus } from "lucide-react";

const STATUS_VARIANT: any = { DRAFT: "muted", SENT: "info", CONFIRMED: "info", PARTIAL: "warning", RECEIVED: "success", CANCELLED: "destructive" };

export default async function PurchaseOrdersPage() {
  const s = await requireSession();
  const orders = await db.purchaseOrder.findMany({ where: { tenantId: s.tenantId, deletedAt: null }, include: { supplier: true }, orderBy: { issueDate: "desc" }, take: 200 });

  return (
    <div>
      <PageHeader title="Ordini Fornitori" description={`${orders.length} ordini`} actions={
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/suppliers">Fornitori</Link></Button>
          <Button asChild><Link href="/admin/purchase-orders/new"><Plus className="h-4 w-4" /> Nuovo ordine</Link></Button>
        </div>
      } />

      {orders.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-7 w-7" />} title="Nessun ordine" description="Crea ordini ai fornitori e carica direttamente il magazzino al ricevimento merce." cta={<Button asChild><Link href="/admin/purchase-orders/new">Nuovo ordine</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Numero</TableHead><TableHead>Fornitore</TableHead><TableHead>Emissione</TableHead><TableHead>Attesa</TableHead><TableHead className="text-right">Totale</TableHead><TableHead>Stato</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="font-mono">{o.number}</TableCell>
                <TableCell>{o.supplier.name}</TableCell>
                <TableCell className="text-xs">{formatDate(o.issueDate)}</TableCell>
                <TableCell className="text-xs">{o.expectedDate ? formatDate(o.expectedDate) : "—"}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(o.total)}</TableCell>
                <TableCell><Badge variant={STATUS_VARIANT[o.status]}>{t(o.status)}</Badge></TableCell>
                <TableCell><Link href={`/admin/purchase-orders/${o.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
