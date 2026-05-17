/**
 * Varianti di intervento predefinite per facilitare il rapportino operatore.
 * Raggruppate per tipologia. Ogni voce può avere note libera.
 */

export type InterventionVariant = {
  id: string;
  label: string;
  defaultDescription?: string;
};

export type InterventionGroup = {
  type: string;
  label: string;
  emoji: string;
  variants: InterventionVariant[];
};

export const INTERVENTION_VARIANTS: InterventionGroup[] = [
  {
    type: "MAINTENANCE", label: "Manutenzione", emoji: "🔧",
    variants: [
      { id: "m-clean-cabin", label: "Pulizia quadro/cabina elettrica" },
      { id: "m-check-conn", label: "Verifica serraggio connessioni e morsettiere" },
      { id: "m-test-diff", label: "Test interruttori differenziali (pulsante prova)" },
      { id: "m-test-mag", label: "Verifica magnetotermici e tarature" },
      { id: "m-earth", label: "Misura impianto di terra (CEI 64-8)" },
      { id: "m-isolation", label: "Misura resistenza isolamento conduttori" },
      { id: "m-check-illum", label: "Verifica funzionamento illuminazione" },
      { id: "m-emerg-light", label: "Test luci emergenza (autonomia 30 min)" },
      { id: "m-replace-bulbs", label: "Sostituzione lampade fulminate" },
      { id: "m-clean-pv", label: "Pulizia pannelli fotovoltaici" },
      { id: "m-check-inverter", label: "Verifica inverter e parametri produzione" },
      { id: "m-check-battery", label: "Test batterie accumulo / continuità" },
      { id: "m-thermography", label: "Termografia infrarossi quadri" },
      { id: "m-cuoda", label: "Pulizia/verifica colonnine ricarica EV" },
      { id: "m-fire-test", label: "Test impianto antincendio e rivelatori" },
    ],
  },
  {
    type: "FAULT", label: "Guasto / Riparazione", emoji: "⚡",
    variants: [
      { id: "f-short", label: "Identificazione e ripristino corto circuito" },
      { id: "f-overload", label: "Risoluzione sovraccarico circuito" },
      { id: "f-replace-mag", label: "Sostituzione interruttore magnetotermico" },
      { id: "f-replace-diff", label: "Sostituzione differenziale" },
      { id: "f-replace-socket", label: "Sostituzione presa/frutto guasto" },
      { id: "f-replace-switch", label: "Sostituzione interruttore" },
      { id: "f-replace-bulb", label: "Sostituzione corpo illuminante" },
      { id: "f-rewire", label: "Rifacimento cablaggio difettoso" },
      { id: "f-no-power", label: "Ripristino mancanza tensione (cabina/contatore)" },
      { id: "f-tripping", label: "Eliminazione scatto intempestivo protezioni" },
      { id: "f-inverter-fault", label: "Diagnostica e riparazione inverter FV" },
    ],
  },
  {
    type: "NEW_INSTALL", label: "Nuovo impianto", emoji: "🆕",
    variants: [
      { id: "n-cable-laying", label: "Posa canaline e tubazioni" },
      { id: "n-cable-pull", label: "Tiraggio cavi" },
      { id: "n-panel-install", label: "Montaggio quadro elettrico" },
      { id: "n-fruit-install", label: "Installazione frutti (prese, interruttori, deviatori)" },
      { id: "n-illum-install", label: "Installazione corpi illuminanti" },
      { id: "n-earth-system", label: "Realizzazione impianto di terra" },
      { id: "n-domotic", label: "Installazione domotica/automazione" },
      { id: "n-pv-modules", label: "Installazione moduli fotovoltaici" },
      { id: "n-pv-inverter", label: "Installazione inverter FV" },
      { id: "n-charger", label: "Installazione colonnina ricarica veicolo elettrico" },
      { id: "n-alarm", label: "Installazione sistema antifurto" },
      { id: "n-cctv", label: "Installazione videosorveglianza" },
      { id: "n-data", label: "Cablaggio rete dati strutturato" },
    ],
  },
  {
    type: "INSPECTION", label: "Collaudo / Verifica", emoji: "✓",
    variants: [
      { id: "i-462-2", label: "Verifica periodica DPR 462 biennale (locali medici/cantieri)" },
      { id: "i-462-5", label: "Verifica periodica DPR 462 quinquennale" },
      { id: "i-final-test", label: "Collaudo finale impianto" },
      { id: "i-dico-prep", label: "Preparazione documenti per DICO" },
      { id: "i-loop", label: "Misura impedenza dell'anello di guasto" },
      { id: "i-continuity", label: "Verifica continuità conduttori protezione" },
      { id: "i-funct-test", label: "Prove funzionali a regola d'arte" },
    ],
  },
  {
    type: "SURVEY", label: "Sopralluogo", emoji: "📄",
    variants: [
      { id: "s-quote", label: "Rilievo per preventivo" },
      { id: "s-feasibility", label: "Studio di fattibilità tecnica" },
      { id: "s-pre-design", label: "Rilievo planimetrico per progetto" },
      { id: "s-photo-doc", label: "Documentazione fotografica stato impianto" },
      { id: "s-customer-needs", label: "Raccolta esigenze cliente" },
    ],
  },
  {
    type: "OTHER", label: "Altro", emoji: "🛠️",
    variants: [
      { id: "o-consulting", label: "Consulenza tecnica" },
      { id: "o-emergency", label: "Intervento di emergenza" },
      { id: "o-training", label: "Formazione/spiegazione al cliente" },
    ],
  },
];

export function getVariantsByType(type: string): InterventionVariant[] {
  return INTERVENTION_VARIANTS.find(g => g.type === type)?.variants || [];
}

export function getAllVariants(): InterventionVariant[] {
  return INTERVENTION_VARIANTS.flatMap(g => g.variants);
}
