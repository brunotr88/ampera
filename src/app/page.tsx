import Link from "next/link";
import { ArrowRight, Zap, Smartphone, Cloud, FileCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/app/theme-toggle";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <header className="border-b border-slate-200/60 dark:border-slate-800 backdrop-blur sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-ampera-700 dark:text-ampera-400">
            <Zap className="h-6 w-6 text-ampera-700 dark:text-ampera-400 fill-ampera-700/20 dark:fill-ampera-400/20" />
            Ampera
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a href="#features" className="hover:text-ampera-700 dark:hover:text-ampera-400">Funzionalità</a>
            <a href="#pricing" className="hover:text-ampera-700 dark:hover:text-ampera-400">Prezzi</a>
            <Link href="/login" className="hover:text-ampera-700 dark:hover:text-ampera-400">Accedi</Link>
            <ThemeToggle />
            <Link href="/login" className="inline-flex items-center gap-1 bg-ampera-700 hover:bg-ampera-800 text-white px-4 py-2 rounded-lg font-semibold shadow-sm">
              Inizia gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle compact />
            <Link href="/login" className="bg-ampera-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Accedi</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-6 py-20 md:py-32 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold bg-ampera-50 text-ampera-700 dark:bg-ampera-950/40 dark:text-ampera-300 px-3 py-1 rounded-full mb-6">
            <Sparkles className="h-3 w-3" /> AI-native · DICO in 5 minuti · Cloud o self-hosted
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-ampera-800 via-ampera-700 to-site dark:from-ampera-300 dark:via-ampera-400 dark:to-site bg-clip-text text-transparent">
            Il gestionale che ragiona<br/>come un elettricista.
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Anagrafiche, preventivi, rapportini mobile, DICO, fatturazione SDI e magazzino in un'unica
            app pensata per le aziende di impianti elettrici italiane.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-ampera-700 hover:bg-ampera-800 text-white px-7 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-ampera-700/20 lift">
              Accedi all'app <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/operatore" className="inline-flex items-center justify-center gap-2 bg-site hover:bg-site-dark text-white px-7 py-4 rounded-xl text-lg font-semibold lift">
              <Smartphone className="h-5 w-5" /> Area operatore
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 container mx-auto px-6">
        <h2 className="font-display text-4xl font-bold text-center mb-3">Tutto quello che serve, niente di più.</h2>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-14">13 moduli, mobile-first, pronto in 30 minuti.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(f => (
            <div key={f.title} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 lift">
              <div className="h-10 w-10 rounded-lg bg-ampera-50 text-ampera-700 dark:bg-ampera-950/40 dark:text-ampera-300 flex items-center justify-center mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-900/60">
        <div className="container mx-auto px-6">
          <h2 className="font-display text-4xl font-bold text-center mb-3">Pricing trasparente. Sempre.</h2>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-12">A differenza dei competitor, qui i prezzi li vedi prima di chiamarci.</p>
          <div className="grid md:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {plans.map(p => (
              <div key={p.name} className={`bg-white dark:bg-slate-900 rounded-xl p-6 border ${p.featured ? "border-ampera-700 ring-2 ring-ampera-700/20 shadow-xl" : "border-slate-200 dark:border-slate-800"} lift`}>
                <div className="font-semibold text-slate-500 dark:text-slate-400">{p.name}</div>
                <div className="font-display text-4xl font-bold my-2">{p.price}<span className="text-sm font-normal text-slate-500 dark:text-slate-400">{p.unit}</span></div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-4">{p.tagline}</div>
                <ul className="text-sm space-y-1.5 mb-5 text-slate-700 dark:text-slate-300">
                  {p.features.map(f => <li key={f}>· {f}</li>)}
                </ul>
                <Link href="/login" className={`block text-center rounded-lg py-2.5 font-semibold ${p.featured ? "bg-ampera-700 text-white hover:bg-ampera-800" : "bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100"}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 text-sm text-slate-500 dark:text-slate-400">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between gap-4">
          <div>© {new Date().getFullYear()} Ampera · by ISIPC · P.IVA 04430490260</div>
          <div className="flex gap-6">
            <a href="/login" className="hover:text-ampera-700 dark:hover:text-ampera-400">Login</a>
            <a href="mailto:info@isipc.com" className="hover:text-ampera-700 dark:hover:text-ampera-400">Contatti</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  { title: "Anagrafiche & Impianti", desc: "Clienti B2C/B2B, sedi multiple, impianti come entità di prima classe con storico interventi.", icon: <Zap className="h-5 w-5" /> },
  { title: "Preventivi smart", desc: "Listini METEL, versioning, firma digitale remota e conversione 1-click in fattura.", icon: <FileCheck className="h-5 w-5" /> },
  { title: "Rapportino mobile", desc: "PWA installabile, offline-first, foto geo-taggate, firma cliente, scarico magazzino automatico.", icon: <Smartphone className="h-5 w-5" /> },
  { title: "DICO automatica", desc: "Generator DM 37/08 conforme con checklist anti-DICO incomplete e archiviazione per impianto.", icon: <FileCheck className="h-5 w-5" /> },
  { title: "SDI integrato", desc: "FatturaPA 1.9.1, conservazione sostitutiva, scadenziario e solleciti automatici.", icon: <FileCheck className="h-5 w-5" /> },
  { title: "Cloud o self-hosted", desc: "SaaS multi-tenant o Docker su tuo server: l'unica scelta in Italia.", icon: <Cloud className="h-5 w-5" /> },
];

const plans = [
  { name: "Free", price: "0€", unit: "/sempre", tagline: "Artigiano singolo", features: ["1 utente", "10 commesse/mese", "SDI base"], cta: "Inizia ora", featured: false },
  { name: "Starter", price: "19€", unit: "/utente/mese", tagline: "1-3 utenti", features: ["Tutto Free", "Multi-utente", "DICO base"], cta: "Prova", featured: false },
  { name: "Pro", price: "29€", unit: "/utente/mese", tagline: "4-15 utenti", features: ["+ AI base", "DICO automatica", "Portale cliente"], cta: "Prova 14gg", featured: true },
  { name: "Business", price: "49€", unit: "/utente/mese", tagline: "16+ utenti", features: ["+ AI avanzata", "API + Webhooks", "Integrazioni grossisti"], cta: "Contattaci", featured: false },
];
