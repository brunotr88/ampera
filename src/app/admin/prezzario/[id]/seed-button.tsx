"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SeedDemoButton({ priceListId }: { priceListId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function seed() {
    if (!confirm("Caricare ~25 voci dimostrative (cavi, quadri, protezioni, illuminazione, fotovoltaico, manodopera)? Le voci già presenti verranno mantenute.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/price-lists/${priceListId}/seed-demo`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Errore");
      toast.success(`${data.created} voci create, ${data.skipped} esistenti`);
      router.refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLoading(false); }
  }

  return (
    <Button onClick={seed} disabled={loading} variant="outline">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Carica voci demo
    </Button>
  );
}
