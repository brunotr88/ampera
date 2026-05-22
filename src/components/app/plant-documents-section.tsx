import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Plus, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export async function PlantDocumentsSection({ tenantId, plantId, customerId }: { tenantId: string; plantId: string; customerId?: string }) {
  const docs = await db.amperaDocument.findMany({
    where: { tenantId, plantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, code: true, title: true, category: true, status: true, signedAt: true, createdAt: true, signatureType: true },
  });

  const newHref = `/admin/documenti/new?plantId=${plantId}${customerId ? `&customerId=${customerId}` : ""}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><FileSignature className="h-4 w-4" /> Documenti impianto ({docs.length})</span>
          <Button asChild size="sm"><Link href={newHref}><Plus className="h-3 w-3" /> Genera</Link></Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun documento per questo impianto. Genera verbale collaudo, consegna, verifica DPR 462…</p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map(d => (
              <li key={d.id} className="py-2 flex items-start justify-between gap-3">
                <Link href={`/admin/documenti/${d.id}`} className="flex-1 group">
                  <div className="font-medium text-sm group-hover:underline">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">{d.code}</span> · {formatDate(d.createdAt)}
                  </div>
                </Link>
                {d.signedAt ? (
                  <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-3 w-3" /> Firmato</Badge>
                ) : (
                  <Badge variant="muted" className="text-[10px]"><Clock className="h-3 w-3" /> {d.status}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
