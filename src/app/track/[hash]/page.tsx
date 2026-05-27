"use client";
import { use, useEffect, useState } from "react";
import { Loader2, AlertTriangle, Wrench, MapPin, User, Calendar, Phone, Mail, Zap, CheckCircle2 } from "lucide-react";

export default function PublicTrackingPage({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = use(params);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/public/track/${hash}`).then(async r => {
      if (!r.ok) { setError((await r.json()).error || "Errore"); return; }
      setData(await r.json());
    });
  }, [hash]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-3" />
          <h1 className="font-bold text-xl text-slate-900 dark:text-white mb-2">Tracciamento non disponibile</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const wo = data.workOrder;
  const states = data.states || [];
  const currentPercentage = wo.currentPercentage || 0;
  const stateColor = wo.currentStateColor || "#3B82F6";
  const customerName = wo.customer.companyName || `${wo.customer.name} ${wo.customer.surname || ""}`.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header tenant */}
        <div className="text-center">
          {wo.tenant.logoUrl ? (
            <img src={wo.tenant.logoUrl} alt={wo.tenant.name} className="h-16 mx-auto object-contain mb-3" />
          ) : (
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <Zap className="h-7 w-7 text-white" />
            </div>
          )}
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{wo.tenant.name}</h2>
          {wo.tenant.phone && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{wo.tenant.phone} · {wo.tenant.email}</p>}
        </div>

        {/* Card principale */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <div className="text-center mb-6">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Ciao <strong>{customerName}</strong>, ecco lo stato del tuo intervento
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
              <Wrench className="inline h-6 w-6 mb-1 text-blue-600 dark:text-blue-400 mr-1" />
              <span className="font-mono text-blue-600 dark:text-blue-400">{wo.code}</span>
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-300 mt-1">{wo.title}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Aggiornato il {new Date(wo.updatedAt).toLocaleString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avanzamento</span>
              <span className="text-sm font-bold" style={{ color: stateColor }}>{currentPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden shadow-inner relative">
              <div
                className="h-4 rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${currentPercentage}%`, background: `linear-gradient(90deg, ${stateColor}cc, ${stateColor})` }}
              >
                {currentPercentage > 10 && (
                  <div className="absolute inset-0 rounded-full opacity-30" style={{ background: "linear-gradient(90deg, transparent, white, transparent)", animation: "shimmer 2s infinite" }} />
                )}
              </div>
            </div>
            <div className="mt-3 text-center">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ backgroundColor: `${stateColor}20`, color: stateColor }}>
                <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: stateColor }} />
                {wo.currentStateName}
              </span>
            </div>
          </div>

          {/* Timeline stati */}
          {states.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Fasi</h3>
              <div className="relative">
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="grid gap-2 sm:gap-0 sm:grid-cols-6 relative">
                  {states.map((st: any) => {
                    const completed = st.percentage < currentPercentage;
                    const current = st.percentage === currentPercentage || st.id === wo.customStateId;
                    return (
                      <div key={st.id} className="flex sm:flex-col items-center gap-2 sm:gap-1">
                        <div className="relative shrink-0">
                          {current ? (
                            <>
                              <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: st.color, transform: "scale(1.6)" }} />
                              <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: st.color }}>
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                              </div>
                            </>
                          ) : completed ? (
                            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: st.color }}>
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] sm:text-center leading-tight"
                          style={{ color: current ? st.color : completed ? "#475569" : "#94a3b8", fontWeight: current ? 700 : completed ? 500 : 400 }}>
                          {st.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Dettagli intervento */}
          <div className="grid sm:grid-cols-2 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            {wo.scheduledDate && (
              <DetailRow icon={<Calendar />} label="Programmato">
                {new Date(wo.scheduledDate).toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" })}
              </DetailRow>
            )}
            {wo.assignedTo && (
              <DetailRow icon={<User />} label="Tecnico">{wo.assignedTo.name}</DetailRow>
            )}
            {wo.plant && (
              <DetailRow icon={<Zap />} label="Impianto">{wo.plant.name}{wo.plant.code ? ` · ${wo.plant.code}` : ""}</DetailRow>
            )}
            {wo.tenant.phone && (
              <DetailRow icon={<Phone />} label="Per assistenza">
                <a href={`tel:${wo.tenant.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline">{wo.tenant.phone}</a>
              </DetailRow>
            )}
          </div>

          {wo.description && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Descrizione lavori</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{wo.description}</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-600 py-2">
          Pagina di tracciamento Ampera · La pagina si aggiorna automaticamente quando il tecnico cambia stato
        </p>
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300 [&_svg]:h-4 [&_svg]:w-4">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
        <div className="text-sm text-slate-900 dark:text-white">{children}</div>
      </div>
    </div>
  );
}
