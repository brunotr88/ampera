"use client";
import { useState, useEffect } from "react";
import { HelpCircle, X, Lightbulb, Keyboard, BookOpen, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageTip = { title: string; body: string; shortcut?: string };
export type PageHelpData = { title: string; intro: string; tips: PageTip[]; shortcuts?: { keys: string; label: string }[]; faqLink?: string };

export function PageHelp({ data, autoShowOnce = false, helpId }: { data: PageHelpData; autoShowOnce?: boolean; helpId?: string }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHidden(localStorage.getItem("ampera-hide-tips") === "1");
    if (autoShowOnce && helpId) {
      const seen = localStorage.getItem(`ampera-help-seen-${helpId}`);
      if (!seen && !hidden) {
        setOpen(true);
        localStorage.setItem(`ampera-help-seen-${helpId}`, "1");
      }
    }
  }, [autoShowOnce, helpId, hidden]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors" title="Guida pagina (Shift+?)">
        <HelpCircle className="h-3.5 w-3.5" /> Guida
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-ampera-700 to-ampera-500 text-white p-5 flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Guida</div>
                <h2 className="font-display text-xl font-bold leading-tight">{data.title}</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-foreground/80 leading-relaxed">{data.intro}</p>

              {data.tips.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Suggerimenti</h3>
                  <ul className="space-y-3">
                    {data.tips.map((t, i) => (
                      <li key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{t.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{t.body}</div>
                          {t.shortcut && <kbd className="inline-block mt-1.5 px-1.5 py-0.5 bg-background border border-border text-[10px] rounded font-mono">{t.shortcut}</kbd>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.shortcuts && data.shortcuts.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Keyboard className="h-4 w-4 text-sky-500" /> Scorciatoie</h3>
                  <ul className="space-y-1.5">
                    {data.shortcuts.map((s, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-foreground/80">{s.label}</span>
                        <kbd className="px-2 py-0.5 bg-muted border border-border text-xs rounded font-mono">{s.keys}</kbd>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <a href={data.faqLink || "/admin/faq"} className="flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary rounded-lg text-sm font-medium transition-colors">
                <span className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> Vai alle FAQ complete</span>
                <ChevronRight className="h-4 w-4" />
              </a>

              <label className="flex items-center gap-2 text-xs text-muted-foreground pt-3 border-t border-border">
                <input
                  type="checkbox"
                  checked={hidden}
                  onChange={(e) => {
                    setHidden(e.target.checked);
                    localStorage.setItem("ampera-hide-tips", e.target.checked ? "1" : "0");
                  }}
                />
                Non mostrare suggerimenti automaticamente
              </label>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
