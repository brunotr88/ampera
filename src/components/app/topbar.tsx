"use client";
import { Search, Bell, Menu, BookOpen } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ user }: { user: any }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buongiorno" : hour < 18 ? "Buon pomeriggio" : "Buonasera";
  return (
    <header className="h-16 sticky top-0 z-20 bg-card/80 backdrop-blur border-b border-border px-4 md:px-6 flex items-center gap-4">
      <button className="md:hidden p-2 hover:bg-accent rounded-lg"><Menu className="h-5 w-5" /></button>
      <div className="hidden md:block">
        <div className="text-sm font-medium">{greeting}, {user?.name?.split(" ")[0] || "amministratore"} 👋</div>
        <div className="text-xs text-muted-foreground">Ecco la tua giornata</div>
      </div>
      <div className="flex-1 max-w-xl mx-auto">
        <button
          type="button"
          onClick={() => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true }); document.dispatchEvent(e); }}
          className="w-full h-10 flex items-center gap-2 rounded-lg border border-input bg-background text-sm text-left text-muted-foreground hover:border-primary/40 px-3"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">Cerca clienti, impianti, rapportini…</span>
          <kbd className="text-[10px] font-semibold bg-muted text-muted-foreground rounded px-1.5 py-0.5">⌘K</kbd>
        </button>
      </div>
      <Link href="/admin/faq" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground p-2 rounded-lg" title="FAQ">
        <BookOpen className="h-4 w-4" />
      </Link>
      <ThemeToggle />
      <Link href="/admin/calendar" className="relative p-2 hover:bg-accent rounded-lg" title="Calendario">
        <Bell className="h-5 w-5" />
      </Link>
    </header>
  );
}
