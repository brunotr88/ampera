import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatCurrency, formatDate } from "@/lib/utils";
import { HELP } from "@/lib/page-help-data";
import { Plus, Phone, Mail, MapPin, Zap, Building2, Wrench, FileText, Shield } from "lucide-react";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const customer = await db.customer.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: {
      contacts: true,
      addresses: true,
      sites: true,
      plants: { take: 10, orderBy: { updatedAt: "desc" } },
      projects: { take: 10, orderBy: { updatedAt: "desc" } },
      quotes: { take: 5, orderBy: { createdAt: "desc" } },
      invoices: { take: 5, orderBy: { issueDate: "desc" } },
      workOrders: { take: 10, orderBy: { scheduledDate: "desc" } },
    },
  });
  if (!customer) return notFound();

  const totalInvoiced = await db.invoice.aggregate({ where: { customerId: customer.id, tenantId: s.tenantId }, _sum: { total: true } });
  const totalUnpaid = await db.invoice.aggregate({ where: { customerId: customer.id, tenantId: s.tenantId, paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] } }, _sum: { total: true, amountPaid: true } });
  const unpaid = (totalUnpaid._sum.total || 0) - (totalUnpaid._sum.amountPaid || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.companyName || `${customer.name} ${customer.surname || ""}`}
        description={`${customer.type} · ${customer.tags.join(", ") || "—"}`}
        back="/admin/customers"
        help={HELP.customer_detail}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline" size="sm"><Link href={`/admin/plants/new?customerId=${customer.id}`}><Zap className="h-4 w-4" /> Impianto</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/admin/work-orders/new?customerId=${customer.id}`}><Wrench className="h-4 w-4" /> Intervento</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/admin/privacy?customerId=${customer.id}`}><Shield className="h-4 w-4" /> Privacy</Link></Button>
            <Button asChild size="sm"><Link href={`/admin/quotes/new?customerId=${customer.id}`}><FileText className="h-4 w-4" /> Preventivo</Link></Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle>Anagrafica</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.vatNumber && <div><span className="text-muted-foreground">P.IVA:</span> <span className="font-mono">{customer.vatNumber}</span></div>}
            {customer.fiscalCode && <div><span className="text-muted-foreground">CF:</span> <span className="font-mono">{customer.fiscalCode}</span></div>}
            {customer.sdiCode && <div><span className="text-muted-foreground">SDI:</span> <span className="font-mono">{customer.sdiCode}</span></div>}
            {customer.pec && <div><span className="text-muted-foreground">PEC:</span> {customer.pec}</div>}
            {customer.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" /> {customer.email}</div>}
            {customer.phone && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</div>}
            {customer.mobile && <div className="flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.mobile}</div>}
            <div className="pt-2 flex gap-2 flex-wrap">
              <Badge variant={customer.status === "ACTIVE" ? "success" : "muted"}>{customer.status}</Badge>
              {customer.gdprConsent && <Badge variant="info">GDPR ✓</Badge>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sedi</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customer.sites.length === 0 && <p className="text-muted-foreground">Nessuna sede registrata.</p>}
            {customer.sites.map(s => (
              <div key={s.id} className="border-b border-border pb-2 last:border-0">
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.street}, {s.city}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Statistiche</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Fatturato totale</span><span className="font-semibold">{formatCurrency(totalInvoiced._sum.total || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Da incassare</span><span className={`font-semibold ${unpaid > 0 ? "text-amber-600" : ""}`}>{formatCurrency(unpaid)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Impianti</span><span className="font-semibold">{customer.plants.length}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Commesse</span><span className="font-semibold">{customer.projects.length}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">Impianti <Button asChild size="sm" variant="ghost"><Link href={`/admin/plants/new?customerId=${customer.id}`}><Plus className="h-3 w-3" /></Link></Button></CardTitle></CardHeader>
          <CardContent>
            {customer.plants.length === 0 ? <p className="text-sm text-muted-foreground">Nessun impianto registrato.</p> : (
              <ul className="divide-y divide-border">
                {customer.plants.map(p => (
                  <li key={p.id} className="py-2 flex justify-between items-center">
                    <Link href={`/admin/plants/${p.id}`} className="hover:underline">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.type} {p.ratedPowerKw ? `· ${p.ratedPowerKw} kW` : ""}</div>
                    </Link>
                    {p.nextCheckDate && <Badge variant="warning">Verifica {formatDate(p.nextCheckDate)}</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Ultimi interventi</CardTitle></CardHeader>
          <CardContent>
            {customer.workOrders.length === 0 ? <p className="text-sm text-muted-foreground">Nessun intervento.</p> : (
              <ul className="divide-y divide-border">
                {customer.workOrders.slice(0, 6).map(w => (
                  <li key={w.id} className="py-2 flex justify-between">
                    <Link href={`/admin/work-orders/${w.id}`} className="hover:underline">
                      <div className="font-medium text-sm">{w.title}</div>
                      <div className="text-xs text-muted-foreground">{w.scheduledDate ? formatDate(w.scheduledDate) : "Non programmato"}</div>
                    </Link>
                    <Badge variant={w.status === "COMPLETED" ? "success" : w.status === "EMERGENCY" ? "destructive" : "info"}>{w.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Attachments entityType="Customer" entityId={customer.id} title="Allegati cliente (contratti, documenti, foto)" accept=".pdf,image/*,.doc,.docx,.xls,.xlsx" />
    </div>
  );
}
