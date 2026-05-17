"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Phone, Play, FileEdit, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export default function WorkOrderMobile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [wo, setWo] = useState<any>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch(`/api/work-orders?mine=1`).then(r => r.json()).then(d => setWo(d.workOrders?.find((x: any) => x.id === id)));
  }, [id]);

  async function startNow() {
    setStarting(true);
    let lat = null, lon = null;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }));
        lat = pos.coords.latitude; lon = pos.coords.longitude;
      } catch {}
    }
    await fetch(`/api/work-orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "IN_PROGRESS", startedAt: new Date(), startLat: lat, startLon: lon }) });
    router.push(`/operatore/work-orders/${id}/report`);
  }

  if (!wo) return <div className="p-10 text-center text-slate-500">Caricamento…</div>;

  return (
    <div className="max-w-md mx-auto">
      <header className="px-5 pt-6 pb-3 flex items-center justify-between">
        <Link href="/operatore" className="text-slate-500"><ChevronLeft className="h-5 w-5" /></Link>
        <span className="text-xs text-slate-500 font-mono">#{wo.code}</span>
        <div />
      </header>

      <section className="px-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase">{formatDateTime(wo.scheduledDate)}</div>
          <h1 className="font-display text-2xl font-bold mt-1">{wo.customer.companyName || `${wo.customer.name} ${wo.customer.surname || ""}`}</h1>
          {wo.site && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(`${wo.site.street}, ${wo.site.city}`)}`} target="_blank" rel="noopener" className="flex items-center gap-1 text-sm text-ampera-700 mt-2">
              <MapPin className="h-4 w-4" /> {wo.site.street}, {wo.site.city}
            </a>
          )}
          {wo.customer.phone && (
            <a href={`tel:${wo.customer.phone}`} className="flex items-center gap-1 text-sm text-slate-600 mt-1">
              <Phone className="h-4 w-4" /> {wo.customer.phone}
            </a>
          )}
          <div className="mt-3 pt-3 border-t border-slate-200">
            <div className="text-sm font-semibold mb-1">{wo.title}</div>
            {wo.description && <p className="text-sm text-slate-600 whitespace-pre-wrap">{wo.description}</p>}
          </div>
          {wo.plant && <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs"><strong>Impianto:</strong> {wo.plant.name} ({wo.plant.type})</div>}
        </div>
      </section>

      <div className="px-5 mt-5 space-y-3">
        {wo.status !== "COMPLETED" && !wo.report ? (
          wo.status === "IN_PROGRESS" ? (
            <Link href={`/operatore/work-orders/${id}/report`} className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-2xl py-4 text-lg font-bold inline-flex items-center justify-center gap-2 shadow-lg pulse-glow">
              <FileEdit className="h-5 w-5" /> Continua rapportino
            </Link>
          ) : (
            <Button size="xl" onClick={startNow} disabled={starting} className="w-full bg-ampera-700 hover:bg-ampera-800 text-white rounded-2xl py-4 text-lg font-bold shadow-lg shadow-ampera-700/30">
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Play className="h-5 w-5 fill-white" /> Inizia intervento</>}
            </Button>
          )
        ) : wo.report ? (
          <Link href={`/operatore/work-orders/${id}/report`} className="w-full bg-emerald-600 text-white rounded-2xl py-4 text-lg font-bold inline-flex items-center justify-center gap-2">
            ✓ Rapportino completato — vedi dettaglio
          </Link>
        ) : null}
      </div>
    </div>
  );
}
