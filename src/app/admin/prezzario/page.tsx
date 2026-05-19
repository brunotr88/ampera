import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import { BookOpen, Plus, Upload, Star, FileText } from "lucide-react";

export default async function PrezzarioPage() {
  const s = await requireSession();
  const lists = await db.priceList.findMany({
    where: { tenantId: s.tenantId },
    orderBy: [{ isDefault: "desc" }, { year: "desc" }, { name: "asc" }],
    include: { _count: { select: { entries: true } } },
  });

  const total = lists.reduce((sum, l) => sum + l._count.entries, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prezzario DEI"
        description={`${lists.length} listini · ${total} voci totali · Riferimenti per preventivi e rapportini`}
        actions={
          <div className="flex gap-2">
            <Button asChild><Link href="/admin/prezzario/new"><Plus className="h-4 w-4" /> Nuovo listino</Link></Button>
          </div>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="Nessun prezzario caricato"
          description="Crea un listino (DEI Impianti Elettrici, regionale, interno) e popola le voci manualmente o via import CSV. Le voci diventeranno selezionabili nei preventivi e rapportini con auto-popolazione di descrizione e prezzo."
          cta={<Button asChild><Link href="/admin/prezzario/new"><Plus className="h-4 w-4" /> Crea primo listino</Link></Button>}
        />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map(l => (
            <Card key={l.id} className={`lift border ${l.isDefault ? "border-primary/40" : "border-border"}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/admin/prezzario/${l.id}`} className="font-display text-lg font-bold hover:underline">
                      {l.name}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-0.5">{l.source} · Anno {l.year}</div>
                  </div>
                  <div className="flex gap-1">
                    {l.isDefault && <Badge variant="default" className="text-[10px]"><Star className="h-3 w-3" /> Default</Badge>}
                    {!l.active && <Badge variant="muted" className="text-[10px]">Disattivato</Badge>}
                  </div>
                </div>

                {l.description && <p className="text-sm text-muted-foreground line-clamp-2">{l.description}</p>}

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground"><FileText className="h-3 w-3 inline" /> {l._count.entries} voci</span>
                  {l.importedAt && <span className="text-muted-foreground">Importato: {formatDate(l.importedAt)}</span>}
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/admin/prezzario/${l.id}`}>Apri</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/prezzario/${l.id}#import`}><Upload className="h-3 w-3" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
