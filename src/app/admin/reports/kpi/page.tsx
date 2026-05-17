import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default async function KpiPage() {
  const s = await requireSession();
  const now = new Date();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startYear = new Date(now.getFullYear(), 0, 1);

  const [invoicedMonth, invoicedYear, openWO, completedWOMonth, reportsMonth, unpaidInvoices, hourSum, customersThisMonth, topCustomers] = await Promise.all([
    db.invoice.aggregate({ where: { tenantId: s.tenantId, issueDate: { gte: startMonth }, type: "INVOICE", deletedAt: null }, _sum: { total: true } }),
    db.invoice.aggregate({ where: { tenantId: s.tenantId, issueDate: { gte: startYear }, type: "INVOICE", deletedAt: null }, _sum: { total: true } }),
    db.workOrder.count({ where: { tenantId: s.tenantId, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, deletedAt: null } }),
    db.workOrder.count({ where: { tenantId: s.tenantId, status: "COMPLETED", endedAt: { gte: startMonth }, deletedAt: null } }),
    db.report.count({ where: { tenantId: s.tenantId, signedAt: { gte: startMonth }, deletedAt: null } }),
    db.invoice.aggregate({ where: { tenantId: s.tenantId, paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, deletedAt: null }, _sum: { total: true, amountPaid: true } }),
    db.timeEntry.aggregate({ where: { report: { tenantId: s.tenantId, signedAt: { gte: startMonth } } }, _sum: { hours: true, amount: true } }),
    db.customer.count({ where: { tenantId: s.tenantId, createdAt: { gte: startMonth }, deletedAt: null } }),
    db.invoice.groupBy({
      by: ["customerId"], where: { tenantId: s.tenantId, issueDate: { gte: startYear }, deletedAt: null },
      _sum: { total: true }, orderBy: { _sum: { total: "desc" } }, take: 10,
    }),
  ]);

  const topCustomerData = await Promise.all(topCustomers.map(async (g) => {
    const c = await db.customer.findUnique({ where: { id: g.customerId } });
    return { name: c?.companyName || c?.name || "?", total: g._sum.total || 0 };
  }));

  const unpaid = (unpaidInvoices._sum.total || 0) - (unpaidInvoices._sum.amountPaid || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Report KPI" description={`Performance ${now.toLocaleString("it-IT", { month: "long", year: "numeric" })}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tile label="Fatturato mese" value={formatCurrency(invoicedMonth._sum.total || 0)} />
        <Tile label="Fatturato anno" value={formatCurrency(invoicedYear._sum.total || 0)} />
        <Tile label="Da incassare" value={formatCurrency(unpaid)} tone="warning" />
        <Tile label="Interventi aperti" value={openWO} />
        <Tile label="Rapportini mese" value={reportsMonth} />
        <Tile label="Interventi chiusi" value={completedWOMonth} />
        <Tile label="Ore tecnici" value={`${(hourSum._sum.hours || 0).toFixed(1)} h`} />
        <Tile label="Nuovi clienti mese" value={customersThisMonth} />
      </div>

      <Card>
        <CardHeader><CardTitle>Top 10 clienti per fatturato (YTD)</CardTitle></CardHeader>
        <CardContent>
          {topCustomerData.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna fattura quest'anno.</p> : (
            <ul className="space-y-2">
              {topCustomerData.map((c, i) => {
                const max = topCustomerData[0].total || 1;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-6 text-xs font-bold text-muted-foreground">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="h-2 bg-muted rounded mt-1 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-ampera-700 to-ampera-500" style={{ width: `${(c.total / max) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-sm font-semibold w-32 text-right">{formatCurrency(c.total)}</div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: any; tone?: "warning" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground font-medium">{label}</div>
        <div className={`font-display text-2xl md:text-[28px] font-bold mt-1 ${tone === "warning" ? "text-amber-600" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
