"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ListChecks, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/operatore", icon: Home, label: "Oggi" },
  { href: "/operatore/all", icon: ListChecks, label: "Tutti" },
  { href: "/operatore/search", icon: Search, label: "Cerca" },
  { href: "/operatore/me", icon: User, label: "Io" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-bottom shadow-lg">
      <div className="grid grid-cols-4 max-w-md mx-auto">
        {items.map(it => {
          const active = it.href === "/operatore" ? pathname === it.href : pathname.startsWith(it.href);
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-1 py-3 text-xs", active ? "text-ampera-700 dark:text-ampera-400" : "text-slate-500 dark:text-slate-400")}>
              <Icon className={cn("h-5 w-5", active && "text-ampera-700 dark:text-ampera-400")} strokeWidth={active ? 2.5 : 2} />
              <span className={cn(active && "font-semibold")}>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
