"use client";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Monitor } from "lucide-react";
import { useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolved } = useTheme();
  const [open, setOpen] = useState(false);
  const Icon = theme === "system" ? Monitor : resolved === "dark" ? Moon : Sun;

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
        className="p-2 rounded-lg hover:bg-accent text-foreground/70"
        title={`Tema: ${theme} (${resolved})`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)} className="p-2 rounded-lg hover:bg-accent text-foreground/70" title="Cambia tema">
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 bg-popover text-popover-foreground border border-border rounded-lg shadow-lg overflow-hidden min-w-[140px]">
            {[
              { v: "light" as const, l: "Chiaro", icon: <Sun className="h-4 w-4" /> },
              { v: "dark" as const, l: "Scuro", icon: <Moon className="h-4 w-4" /> },
              { v: "system" as const, l: "Sistema", icon: <Monitor className="h-4 w-4" /> },
            ].map(o => (
              <button key={o.v} onClick={() => { setTheme(o.v); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent ${theme === o.v ? "bg-accent/50 font-semibold" : ""}`}>
                {o.icon} {o.l}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
