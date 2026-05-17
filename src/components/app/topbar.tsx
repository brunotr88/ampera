"use client";
import { Search, Bell, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export function Topbar({ user }: { user: any }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  const [open, setOpen] = useState(false);
  return (
    <header className="h-16 sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border px-4 md:px-6 flex items-center gap-4">
      <button className="md:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
      <div className="hidden md:block">
        <div className="text-sm font-medium">{greeting}, {user?.name?.split(" ")[0] || "amministratore"} 👋</div>
        <div className="text-xs text-muted-foreground">Ecco la tua giornata</div>
      </div>
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Cerca clienti, impianti, rapportini…" className="w-full h-10 pl-10 pr-16 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none" />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold bg-muted text-muted-foreground rounded px-1.5 py-0.5">⌘K</kbd>
        </div>
      </div>
      <Link href="/admin/calendar" className="relative p-2 hover:bg-accent rounded-lg">
        <Bell className="h-5 w-5" />
      </Link>
    </header>
  );
}
