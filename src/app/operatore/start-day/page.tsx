"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StartDayPage() {
  const router = useRouter();
  const [locating, setLocating] = useState(false);
  const [done, setDone] = useState(false);

  async function start() {
    setLocating(true);
    try {
      if (navigator.geolocation) {
        await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 }));
      }
      setDone(true);
      setTimeout(() => router.push("/operatore"), 1200);
    } catch {
      setDone(true);
      setTimeout(() => router.push("/operatore"), 1200);
    }
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-10 text-center">
      <div className="h-24 w-24 rounded-full bg-ampera-100 flex items-center justify-center mx-auto mb-5">
        {done ? <Clock className="h-12 w-12 text-emerald-600" /> : <MapPin className="h-12 w-12 text-ampera-700" />}
      </div>
      <h1 className="font-display text-3xl font-bold">{done ? "Buona giornata!" : "Pronti a iniziare?"}</h1>
      <p className="text-slate-600 dark:text-slate-400 dark:text-slate-500 mt-2 mb-8">{done ? "Ingresso timbrato con GPS." : "Timbreremo il tuo ingresso con la posizione GPS."}</p>
      {!done && (
        <Button size="xl" onClick={start} disabled={locating} className="w-full bg-ampera-700 py-5 text-lg shadow-lg shadow-ampera-700/30">
          {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : "Timbra ingresso"}
        </Button>
      )}
    </div>
  );
}
