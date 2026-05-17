import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { t } from "@/lib/labels";
import { Building2, Plus } from "lucide-react";

export default async function AssetsPage() {
  const s = await requireSession();
  const assets = await db.assetAcquisition.findMany({
    where: { tenantId: s.tenantId },
    orderBy: { acquisitionDate: "desc" },
  });

  const totalValue = assets.reduce((s, a) => s + (a.status === "ACTIVE" ? a.purchasePrice : 0), 0);
  const totalCount = assets.filter(a => a.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Cespiti aziendali" description={`${totalCount} cespiti attivi · ${formatCurrency(totalValue)} valore di acquisto`}
        actions={<Button asChild><Link href="/admin/assets/new"><Plus className="h-4 w-4" /> Nuovo cespite</Link></Button>} />

      {assets.length === 0 ? (
        <EmptyState icon={<Building2 className="h-7 w-7" />} title="Nessun cespite" description="Registra macchinari, attrezzature, hardware acquistati come beni strumentali. Tracciamo costo, ammortamento, dismissione." cta={<Button asChild><Link href="/admin/assets/new">Nuovo cespite</Link></Button>} />
      ) : (
        <Table>
          <TableHeader><TableRow><TableHead>Codice</TableHead><TableHead>Nome</TableHead><TableHead>Categoria</TableHead><TableHead>Data acq.</TableHead><TableHead className="text-right">Prezzo</TableHead><TableHead>Ammort.</TableHead><TableHead>Stato</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {assets.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-mono text-xs">{a.code}</TableCell>
                <TableCell><div className="font-medium">{a.name}</div>{a.serialNumber && <div className="text-xs text-muted-foreground">S/N {a.serialNumber}</div>}</TableCell>
                <TableCell>{a.category || "—"}</TableCell>
                <TableCell className="text-xs">{formatDate(a.acquisitionDate)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(a.purchasePrice)}</TableCell>
                <TableCell className="text-xs">{a.amortizationYears}y</TableCell>
                <TableCell><Badge variant={a.status === "ACTIVE" ? "success" : a.status === "DISPOSED" || a.status === "WRITTEN_OFF" ? "destructive" : "muted"}>{t(a.status)}</Badge></TableCell>
                <TableCell><Link href={`/admin/assets/${a.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
