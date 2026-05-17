"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HELP } from "@/lib/page-help-data";
import { Search, ChevronDown, ChevronUp, BookOpen } from "lucide-react";

export default function FaqPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [audience, setAudience] = useState<"ADMIN" | "OPERATOR" | "CUSTOMER" | "PUBLIC">("ADMIN");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function load() {
    fetch(`/api/faq?audience=${audience}&q=${encodeURIComponent(q)}`).then(r => r.json()).then(d => setFaqs(d.faqs || []));
  }
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [audience, q]);

  const grouped = faqs.reduce<Record<string, any[]>>((a, f) => {
    const c = f.category || "Altro";
    (a[c] = a[c] || []).push(f);
    return a;
  }, {});

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader title="FAQ & Guide" description={`${faqs.length} domande frequenti`} help={HELP.faq} />

      <div className="flex flex-col md:flex-row gap-3">
        <Card className="md:w-72 shrink-0">
          <CardContent className="p-3">
            <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-2 pb-2">Pubblico</div>
            {[
              { v: "ADMIN" as const, l: "Amministratore", desc: "Tutte le funzioni gestionali" },
              { v: "OPERATOR" as const, l: "Operatore", desc: "Uso app mobile in cantiere" },
              { v: "CUSTOMER" as const, l: "Cliente", desc: "Portale e preventivi" },
              { v: "PUBLIC" as const, l: "Pubblico", desc: "Info generali Ampera" },
            ].map(o => (
              <button key={o.v} onClick={() => setAudience(o.v)} className={`w-full text-left p-2 rounded-lg text-sm ${audience === o.v ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                <div className="font-medium">{o.l}</div>
                <div className={`text-xs ${audience === o.v ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{o.desc}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="flex-1 space-y-4">
          <Card><CardContent className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Cerca nelle FAQ…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
          </CardContent></Card>

          {Object.keys(grouped).length === 0 ? (
            <Card><CardContent className="p-10 text-center"><BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground" /><p>Nessuna FAQ trovata.</p></CardContent></Card>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-2 px-1">{cat}</h2>
                <Card>
                  <CardContent className="p-0 divide-y divide-border">
                    {items.map(f => (
                      <div key={f.id} className="p-4">
                        <button onClick={() => setOpenId(openId === f.id ? null : f.id)} className="w-full flex items-center justify-between text-left gap-3">
                          <span className="font-medium text-sm">{f.question}</span>
                          {openId === f.id ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                        </button>
                        {openId === f.id && (
                          <div className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{f.answer}
                            {f.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {f.tags.map((t: string) => <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
