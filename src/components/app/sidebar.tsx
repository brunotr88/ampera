"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, Wrench, FileText, ClipboardList, Calendar, Package, Truck, FileCheck, Receipt,
  TrendingUp, Settings, LogOut, Zap, Building2, BadgeEuro, ShoppingCart, BookMarked, CalendarDays, Sun, BarChart3,
  Award, Shield, BookOpen, User
} from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Clienti", icon: Users },
  { href: "/admin/plants", label: "Impianti", icon: Zap },
  { href: "/admin/projects", label: "Commesse", icon: Building2 },
  { href: "/admin/work-orders", label: "Interventi", icon: Wrench },
  { href: "/admin/reports", label: "Rapportini", icon: ClipboardList },
  { href: "/admin/quotes", label: "Preventivi", icon: FileText },
  { href: "/admin/invoices", label: "Fatture", icon: Receipt },
  { href: "/admin/cashbook", label: "Prima Nota", icon: BadgeEuro },
  { href: "/admin/purchase-orders", label: "Ordini Fornitori", icon: ShoppingCart },
  { href: "/admin/purchase-invoices", label: "Fatture Acquisto", icon: Receipt },
  { href: "/admin/warehouse", label: "Magazzino", icon: Package },
  { href: "/admin/materials", label: "Articoli", icon: BookMarked },
  { href: "/admin/contracts", label: "Manutenzioni", icon: Truck },
  { href: "/admin/vehicles", label: "Flotta veicoli", icon: Truck },
  { href: "/admin/assets", label: "Cespiti", icon: Building2 },
  { href: "/admin/dico", label: "DICO", icon: FileCheck },
  { href: "/admin/calendar", label: "Calendario", icon: Calendar },
  { href: "/admin/vacations", label: "Ferie & Permessi", icon: Sun },
  { href: "/admin/incentives", label: "Agevolazioni", icon: Award },
  { href: "/admin/prezzario", label: "Prezzario DEI", icon: BookOpen },
  { href: "/admin/privacy", label: "Privacy & GDPR", icon: Shield },
  { href: "/admin/faq", label: "FAQ & Guide", icon: BookOpen },
  { href: "/admin/reports/kpi", label: "Report KPI", icon: BarChart3 },
  { href: "/admin/profile", label: "Profilo & Password", icon: User },
  { href: "/admin/settings", label: "Impostazioni", icon: Settings },
];

export function Sidebar({ user }: { user: any }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-border bg-card flex-col h-screen sticky top-0">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Zap className="h-6 w-6 text-ampera-700 fill-ampera-700/20" />
        <span className="font-display font-bold text-xl">Ampera</span>
      </Link>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
            )}>
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-full bg-ampera-50 text-ampera-700 flex items-center justify-center text-sm font-semibold">{(user?.name || "?").substring(0,2).toUpperCase()}</div>
          <div className="text-sm leading-tight">
            <div className="font-semibold truncate max-w-[10rem]">{user?.name}</div>
            <div className="text-muted-foreground text-xs">{user?.role}</div>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent text-foreground/70">
          <LogOut className="h-4 w-4" /> Esci
        </button>
      </div>
    </aside>
  );
}
