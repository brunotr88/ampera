import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSignature, Plus, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export async function CustomerDocumentsSection({ tenantId, customerId }: { tenantId: string; customerId: string }) {
  const docs = await db.amperaDocument.findMany({
    where: { tenantId, customerId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, code: true, title: true, category: true, status: true, signedAt: true, createdAt: true, signatureType: true },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2"><FileSignature className="h-4 w-4" /> Documenti ({docs.length})</span>
          <Button asChild size="sm">
            <Link href={`/admin/documenti/new?customerId=${customerId}`}><Plus className="h-3 w-3" /> Genera</Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessun documento per questo cliente. Genera verbali, attestati o dichiarazioni.</p>
        ) : (
          <ul className="divide-y divide-border">
            {docs.map(d => (
              <li key={d.id} className="py-2 flex items-start justify-between gap-3">
                <Link href={`/admin/documenti/${d.id}`} className="flex-1 group">
                  <div className="font-medium text-sm group-hover:underline">{d.title}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-mono">{d.code}</span> · {d.category.replace(/_/g, " ")} · {formatDate(d.createdAt)}
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-1">
                  {d.signedAt ? (
                    <Badge variant="success" className="text-[10px]"><CheckCircle2 className="h-3 w-3" /> Firmato</Badge>
                  ) : (
                    <Badge variant="muted" className="text-[10px]"><Clock className="h-3 w-3" /> {d.status}</Badge>
                  )}
                  {d.signatureType && <span className="text-[10px] text-muted-foreground">{d.signatureType}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
