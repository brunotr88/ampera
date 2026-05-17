import { requireSession } from "@/lib/permissions";
import { t } from "@/lib/labels";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, timeAgo } from "@/lib/utils";
import { PageHelp } from "@/components/app/page-help";
import { HELP } from "@/lib/page-help-data";
import Link from "next/link";
import { Users, Wrench, Receipt, TrendingUp, Calendar, AlertTriangle, FileCheck, Zap, ArrowRight, ClipboardList } from "lucide-react";

export default async function DashboardPage() {
  const s = await requireSession();
  const tid = s.tenantId;

  const [customers, openWO, reportsThisMonth, invoicesUnpaid, contractsDue, dicosDraft, upcomingEvents, lastReports] = await Promise.all([
    db.customer.count({ where: { tenantId: tid, deletedAt: null } }),
    db.workOrder.count({ where: { tenantId: tid, status: { in: ["SCHEDULED", "IN_PROGRESS"] }, deletedAt: null } }),
    db.report.count({ where: { tenantId: tid, signedAt: { gte: startOfMonth() }, deletedAt: null } }),
    db.invoice.aggregate({ where: { tenantId: tid, paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, deletedAt: null }, _sum: { total: true, amountPaid: true } }),
    db.maintenanceContract.findMany({ where: { tenantId: tid, active: true, nextDueDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, include: { customer: true }, orderBy: { nextDueDate: "asc" }, take: 6 }),
    db.conformityDeclaration.count({ where: { tenantId: tid, status: "DRAFT" } }),
    db.calendarEvent.findMany({ where: { tenantId: tid, startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 6 }),
    db.report.findMany({ where: { tenantId: tid, deletedAt: null }, include: { customer: true, technician: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
  ]);

  const unpaidTotal = (invoicesUnpaid._sum.total || 0) - (invoicesUnpaid._sum.amountPaid || 0);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl gradient-mesh bg-grid p-6 md:p-8 text-white">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-xs font-semibold text-white/70 uppercase tracking-wider">Panoramica</div>
            <div className="opacity-80 hover:opacity-100 transition-opacity"><PageHelp data={HELP.dashboard} /></div>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Ciao {s.name.split(" ")[0]}, hai {openWO} interventi aperti</h1>
          <p className="text-white/70 mb-5">Marginalità, scadenze e operatività dell'azienda in un colpo d'occhio.</p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/admin/work-orders/new" className="bg-white text-ampera-800 hover:bg-white/90 rounded-lg px-4 py-2 font-semibold text-sm inline-flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Pianifica intervento
            </Link>
            <Link href="/admin/quotes/new" className="bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-4 py-2 font-semibold text-sm inline-flex items-center gap-2">
              <FileText /> Nuovo preventivo
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={<Users />} label="Clienti" value={customers} hint="totali" href="/admin/customers" tone="primary" />
        <StatTile icon={<Wrench />} label="Interventi" value={openWO} hint="aperti" href="/admin/work-orders" tone="accent" />
        <StatTile icon={<ClipboardList />} label="Rapportini" value={reportsThisMonth} hint="questo mese" href="/admin/reports" tone="success" />
        <StatTile icon={<Receipt />} label="Da incassare" value={formatCurrency(unpaidTotal)} hint="netti" href="/admin/invoices" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Ultimi rapportini
              <Link href="/admin/reports" className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">Vedi tutti <ArrowRight className="h-3 w-3" /></Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lastReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun rapportino ancora. Quando i tecnici chiuderanno il primo lavoro lo vedrai qui.</p>
            ) : (
              <ul className="divide-y divide-border">
                {lastReports.map(r => (
                  <li key={r.id} className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-ampera-50 text-ampera-700 flex items-center justify-center"><ClipboardList className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{r.customer.companyName || `${r.customer.name} ${r.customer.surname || ""}`} · #{r.code}</div>
                      <div className="text-xs text-muted-foreground">{r.technician.name} · {timeAgo(r.updatedAt)}</div>
                    </div>
                    <Badge variant={r.status === "SUBMITTED" ? "success" : r.status === "DRAFT" ? "warning" : "muted"}>{t(r.status)}</Badge>
                    <Link href={`/admin/reports/${r.id}`} className="text-xs font-medium text-primary hover:underline">Apri</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">Prossimi appuntamenti<Link href="/admin/calendar" className="text-xs font-medium text-primary hover:underline">Vedi calendario</Link></CardTitle></CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Niente in agenda per ora.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map(e => (
                  <li key={e.id} className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg bg-accent/15 text-accent flex items-center justify-center shrink-0"><Calendar className="h-4 w-4" /></div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(e.startsAt, "dd/MM HH:mm")} · {e.type}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">Manutenzioni in scadenza (30 gg)<AlertTriangle className="h-4 w-4 text-amber-500" /></CardTitle></CardHeader>
          <CardContent>
            {contractsDue.length === 0 ? (
              <p className="text-sm text-muted-foreground">Niente in scadenza nei prossimi 30 giorni.</p>
            ) : (
              <ul className="divide-y divide-border">
                {contractsDue.map(c => (
                  <li key={c.id} className="py-3 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center"><Truck className="h-4 w-4" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.customer.companyName || c.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{c.name}</div>
                    </div>
                    <Badge variant="warning">{formatDate(c.nextDueDate)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center justify-between">Quick actions <Zap className="h-4 w-4 text-ampera-700" /></CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <QuickAction href="/admin/customers/new" icon={<Users />} label="Nuovo cliente" tone="primary" />
            <QuickAction href="/admin/plants/new" icon={<Zap />} label="Nuovo impianto" />
            <QuickAction href="/admin/quotes/new" icon={<FileText />} label="Nuovo preventivo" />
            <QuickAction href="/admin/invoices/new" icon={<Receipt />} label="Nuova fattura" />
            <QuickAction href="/admin/cashbook/new" icon={<BadgeEuro />} label="Prima nota" />
            <QuickAction href="/admin/purchase-orders/new" icon={<ShoppingCart />} label="Ordine fornitore" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { FileText, BadgeEuro, ShoppingCart, Truck } from "lucide-react";

function StatTile({ icon, label, value, hint, href, tone = "primary" }: { icon: React.ReactNode; label: string; value: any; hint: string; href: string; tone?: "primary" | "accent" | "success" | "warning" }) {
  const toneCls = {
    primary: "from-ampera-700 to-ampera-500 text-white",
    accent: "from-site to-site-dark text-white",
    success: "from-emerald-500 to-emerald-700 text-white",
    warning: "from-amber-500 to-orange-600 text-white",
  }[tone];
  return (
    <Link href={href} className="lift block">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${toneCls} flex items-center justify-center shadow-sm`}>{icon}</div>
            <div className="flex-1">
              <div className="text-xs text-muted-foreground font-medium">{label}</div>
              <div className="font-display text-2xl md:text-[28px] font-bold leading-none mt-1">{value}</div>
              <div className="text-[10px] text-muted-foreground mt-1">{hint}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickAction({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone?: "primary" }) {
  return (
    <Link href={href} className={`flex items-center gap-2 rounded-lg border border-border bg-card hover:bg-accent/10 px-3 py-2.5 text-sm font-medium transition ${tone === "primary" ? "bg-primary/5 text-primary border-primary/20" : ""}`}>
      <span className="h-4 w-4">{icon}</span>{label}
    </Link>
  );
}

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
