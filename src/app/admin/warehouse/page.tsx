import Link from "next/link";
import { t } from "@/lib/labels";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package } from "lucide-react";

export default async function WarehousePage() {
  const s = await requireSession();
  const [warehouses, movements] = await Promise.all([
    db.warehouse.findMany({ where: { tenantId: s.tenantId, active: true }, include: { assignedTo: true } }),
    db.stockMovement.findMany({ where: { tenantId: s.tenantId }, include: { material: true, warehouse: true, user: true }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  // Stock by material/warehouse
  const stockMap = new Map<string, number>();
  for (const m of movements) {
    const k = `${m.materialId}|${m.warehouseId}`;
    const delta = m.type === "IN" || m.type === "RETURN" ? m.quantity : m.type === "OUT" ? -m.quantity : 0;
    stockMap.set(k, (stockMap.get(k) || 0) + delta);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Magazzino" description={`${warehouses.length} magazzini, ${movements.length} movimenti recenti`} />

      <div className="grid md:grid-cols-3 gap-4">
        {warehouses.map(w => (
          <Card key={w.id}>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{w.name}</CardTitle></CardHeader>
            <CardContent>
              <Badge variant="outline">{t(w.type)}</Badge>
              {w.assignedTo && <div className="text-xs text-muted-foreground mt-2">Assegnato a {w.assignedTo.name}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Ultimi movimenti</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Articolo</TableHead><TableHead>Magazzino</TableHead><TableHead className="text-right">Q.tà</TableHead><TableHead>Riferimento</TableHead></TableRow></TableHeader>
            <TableBody>
              {movements.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground"><Package className="h-7 w-7 mx-auto mb-2" />Nessun movimento</TableCell></TableRow> : movements.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs">{formatDate(m.createdAt)}</TableCell>
                  <TableCell><Badge variant={m.type === "IN" ? "success" : m.type === "OUT" ? "warning" : "muted"}>{t(m.type)}</Badge></TableCell>
                  <TableCell>{m.material?.name || "—"}</TableCell>
                  <TableCell>{m.warehouse.name}</TableCell>
                  <TableCell className={`text-right font-semibold ${m.type === "IN" ? "text-emerald-600" : "text-amber-600"}`}>{m.type === "IN" ? "+" : "-"}{m.quantity}</TableCell>
                  <TableCell className="text-xs">{m.reference || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
