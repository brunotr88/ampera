import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { Wrench, MapPin, Clock, ChevronRight, Play, CheckCircle2 } from "lucide-react";

export default async function OperatoreHome() {
  const s = await requireSession();
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  const workOrders = await db.workOrder.findMany({
    where: {
      tenantId: s.tenantId, assignedToId: s.id, deletedAt: null,
      OR: [
        { scheduledDate: { gte: startOfDay, lte: endOfDay } },
        { status: "IN_PROGRESS" },
      ],
    },
    include: { customer: true, plant: true, site: true, report: { select: { id: true } } },
    orderBy: { scheduledDate: "asc" },
  });

  const hour = today.getHours();
  const greeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  const todayLabel = today.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-4">
        <div className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">{todayLabel}</div>
        <h1 className="font-display text-3xl font-bold mt-1">{greeting}, {s.name.split(" ")[0]} 👋</h1>
        <p className="text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-1">Hai <strong>{workOrders.length}</strong> {workOrders.length === 1 ? "intervento" : "interventi"} oggi</p>
      </header>

      <div className="px-5">
        <Link href="/operatore/start-day" className="block bg-gradient-to-br from-ampera-700 to-site rounded-2xl text-white p-5 shadow-lg shadow-ampera-700/20 lift mb-5">
          <div className="flex items-center gap-3">
            <Play className="h-7 w-7 fill-white/20" />
            <div className="flex-1">
              <div className="font-display font-bold text-xl">Inizia giornata</div>
              <div className="text-xs text-white/80">Timbra ingresso con GPS</div>
            </div>
            <ChevronRight className="h-5 w-5" />
          </div>
        </Link>
      </div>

      <section className="px-5 space-y-3">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Interventi di oggi</span>
          <Link href="/operatore/all" className="text-ampera-700 text-xs font-medium">Vedi tutti →</Link>
        </div>

        {workOrders.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold">Niente in vista per oggi.</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Buon riposo!</p>
          </div>
        ) : (
          workOrders.map(w => (
            <Link key={w.id} href={`/operatore/work-orders/${w.id}`} className={`block bg-white dark:bg-slate-900 rounded-2xl p-4 border lift ${w.status === "IN_PROGRESS" ? "border-amber-400" : w.status === "COMPLETED" ? "border-emerald-300 opacity-70" : "border-slate-200 dark:border-slate-800"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {w.status === "IN_PROGRESS" && <div className="h-2 w-2 rounded-full bg-amber-500 pulse-glow" />}
                    {w.status === "COMPLETED" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500">
                      {w.scheduledDate ? new Date(w.scheduledDate).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </span>
                    {w.priority === "EMERGENCY" && <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-1.5 py-0.5 rounded">EMERGENZA</span>}
                    {w.priority === "URGENT" && <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Urgente</span>}
                  </div>
                  <div className="font-semibold text-base">{w.customer.companyName || `${w.customer.name} ${w.customer.surname || ""}`}</div>
                  {w.site && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" /> {w.site.street}, {w.site.city}
                    </div>
                  )}
                  <div className="text-sm text-slate-700 dark:text-slate-300 mt-2 line-clamp-2">{w.title}</div>
                  {w.estimatedMinutes && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3" /> {w.estimatedMinutes} min previsti
                    </div>
                  )}
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400 dark:text-slate-500 shrink-0 mt-1" />
              </div>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
