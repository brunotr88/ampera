/**
 * Italian construction tax incentives (aggiornato al 2026).
 * Note: percentuali e massimali soggetti a leggi di bilancio annuali.
 * Riferimenti normativi citati per ogni incentivo.
 */

export type IncentiveDef = {
  type: string;
  label: string;
  description: string;
  percentage: number;
  yearsRecovery: number;
  maxAmount?: number;
  category: "edilizia" | "energia" | "sicurezza" | "accessibilita" | "mobilita" | "fotovoltaico";
  normative: string;
  validUntil?: string;
  beneficiaries: string[];
  workTypes: string[];
  required: {
    bankTransfer: boolean;
    bankTransferDescription?: string;
    enéa: boolean;
    enéaWithinDays?: number;
    asseveration: boolean;
    cessionAllowed: boolean;
    invoiceMention?: string;
    documents: string[];
  };
  notes?: string;
};

export const INCENTIVES: IncentiveDef[] = [
  {
    type: "RESTRUCTURING_50",
    label: "Bonus Ristrutturazioni 50%",
    description: "Detrazione IRPEF 50% delle spese sostenute per interventi di recupero edilizio su singole unità abitative.",
    percentage: 50,
    yearsRecovery: 10,
    maxAmount: 96000,
    category: "edilizia",
    normative: "Art. 16-bis TUIR (DPR 917/86)",
    validUntil: "31/12/2027 (50% prima casa, 36% altri immobili)",
    beneficiaries: ["Proprietario", "Inquilino", "Comodatario", "Familiari conviventi", "Condominio (parti comuni)"],
    workTypes: [
      "Manutenzione straordinaria",
      "Restauro e risanamento conservativo",
      "Ristrutturazione edilizia",
      "Interventi sismici",
      "Adeguamento normativo impianti",
      "Realizzazione impianto elettrico ex-novo durante ristrutturazione",
      "Realizzazione domotica",
      "Sistemi antifurto e videosorveglianza",
    ],
    required: {
      bankTransfer: true,
      bankTransferDescription: "Bonifico parlante: causale art. 16-bis TUIR DPR 917/86, codice fiscale beneficiario, P.IVA beneficiario pagamento, n. fattura",
      enéa: false,
      asseveration: false,
      cessionAllowed: false,
      invoiceMention: "Spesa detraibile ai sensi art. 16-bis DPR 917/86",
      documents: [
        "Bonifico parlante (banca/posta)",
        "Fattura con dicitura normativa",
        "Dati catastali immobile",
        "Domanda all'amministratore se condominio",
        "CILA/CILA-S/SCIA se richiesta",
      ],
    },
    notes: "Cumulabile con detrazione IVA 10%. Dal 2024 niente cessione/sconto in fattura.",
  },
  {
    type: "ECOBONUS_65",
    label: "Ecobonus 65%",
    description: "Detrazione per interventi di riqualificazione energetica (caldaie a condensazione classe A+, schermature solari, micro-cogeneratori, pannelli solari termici).",
    percentage: 65,
    yearsRecovery: 10,
    category: "energia",
    normative: "Art. 14 D.L. 63/2013 conv. L. 90/2013",
    validUntil: "31/12/2025 (in revisione)",
    beneficiaries: ["Persone fisiche", "Imprese", "Condomini"],
    workTypes: [
      "Coibentazione strutture opache (50-65%)",
      "Caldaia a condensazione classe A+ con termoregolazione (65%)",
      "Pompe di calore (65%)",
      "Schermature solari (50%)",
      "Pannelli solari termici (65%)",
      "Micro-cogeneratori (65%)",
      "Building automation domotica risparmio energetico (65%)",
    ],
    required: {
      bankTransfer: true,
      bankTransferDescription: "Causale Ecobonus art. 14 D.L. 63/2013, CF beneficiario, P.IVA azienda esecutrice",
      enéa: true,
      enéaWithinDays: 90,
      asseveration: true,
      cessionAllowed: false,
      invoiceMention: "Spesa per Ecobonus art. 14 D.L. 63/2013",
      documents: [
        "Asseverazione tecnico abilitato (APE pre+post)",
        "Bonifico parlante",
        "Comunicazione ENEA entro 90 gg",
        "Fatture con riferimento normativo",
        "Schede tecniche prodotti certificati",
      ],
    },
    notes: "Asseverazione obbligatoria. APE pre/post intervento per dimostrare miglioramento.",
  },
  {
    type: "BARRIER_REMOVAL_75",
    label: "Bonus Eliminazione Barriere Architettoniche 75%",
    description: "Detrazione 75% per interventi finalizzati al superamento ed eliminazione barriere architettoniche.",
    percentage: 75,
    yearsRecovery: 5,
    maxAmount: 50000,
    category: "accessibilita",
    normative: "Art. 119-ter D.L. 34/2020 conv. L. 77/2020",
    validUntil: "31/12/2025",
    beneficiaries: ["Persone fisiche", "Condomini", "Imprese", "Enti non commerciali", "ONLUS/APS/OdV"],
    workTypes: [
      "Installazione ascensori",
      "Montascale",
      "Servoscale",
      "Piattaforme elevatrici",
      "Sostituzione infissi (con caratteristiche specifiche)",
      "Adeguamento bagni",
      "Rampe",
      "Sistemi domotici per disabili",
      "Automazione cancelli/portoni",
    ],
    required: {
      bankTransfer: true,
      bankTransferDescription: "Causale art. 119-ter D.L. 34/2020 abbattimento barriere architettoniche",
      enéa: false,
      asseveration: false,
      cessionAllowed: true,
      invoiceMention: "Spesa per eliminazione barriere architettoniche art. 119-ter D.L. 34/2020",
      documents: [
        "Bonifico parlante",
        "Fattura con riferimento normativo",
        "Asseverazione tecnica conformità DM 236/89",
        "Documentazione fotografica pre/post (consigliata)",
      ],
    },
    notes: "Cessione del credito e sconto in fattura ANCORA AMMESSI (eccezione importante).",
  },
  {
    type: "CHARGING_STATION_80",
    label: "Bonus Colonnine Ricarica 80%",
    description: "Detrazione 80% per acquisto e installazione colonnine ricarica veicoli elettrici.",
    percentage: 80,
    yearsRecovery: 5,
    maxAmount: 2000,
    category: "mobilita",
    normative: "Art. 16-ter D.L. 63/2013 (modificato L. 234/2021)",
    validUntil: "31/12/2025 (in valutazione)",
    beneficiaries: ["Persone fisiche", "Condomini", "Imprese"],
    workTypes: [
      "Acquisto colonnina ricarica AC/DC",
      "Installazione colonnina ricarica",
      "Opere edili e impianti elettrici accessori",
      "Cablaggi linea dedicata",
      "Contatore dedicato (se necessario)",
    ],
    required: {
      bankTransfer: true,
      bankTransferDescription: "Causale art. 16-ter D.L. 63/2013 colonnina ricarica",
      enéa: false,
      asseveration: false,
      cessionAllowed: false,
      invoiceMention: "Spesa per colonnina ricarica art. 16-ter D.L. 63/2013",
      documents: [
        "Bonifico parlante",
        "Fattura con riferimento normativo",
        "Scheda tecnica colonnina",
        "DICO impianto elettrico",
      ],
    },
    notes: "Massimale per condomini più alto (€1.500 per box auto fino a 8). Lavoro deve essere terminato e collaudato.",
  },
  {
    type: "SEISMABONUS_70",
    label: "Sismabonus 70-80%",
    description: "Detrazione 70-80% per interventi antisismici. Su edifici in zone 1, 2 e 3.",
    percentage: 70,
    yearsRecovery: 5,
    maxAmount: 96000,
    category: "sicurezza",
    normative: "Art. 16 D.L. 63/2013, comma 1-bis e seguenti",
    validUntil: "31/12/2024 (in proroga)",
    beneficiaries: ["Persone fisiche", "Imprese", "Condomini"],
    workTypes: [
      "Miglioramento sismico classe inferiore (70%)",
      "Miglioramento sismico classi inferiori (80%)",
      "Demolizione e ricostruzione zona sismica 1-2-3",
    ],
    required: {
      bankTransfer: true,
      enéa: false,
      asseveration: true,
      cessionAllowed: false,
      invoiceMention: "Spesa Sismabonus art. 16 D.L. 63/2013",
      documents: [
        "Asseverazione classe sismica pre/post (ing. strutturista)",
        "Bonifico parlante",
        "Fatture con riferimento",
        "Permesso/Cila/SCIA",
      ],
    },
  },
  {
    type: "GREEN_BONUS_36",
    label: "Bonus Verde 36%",
    description: "Detrazione 36% per sistemazione verde di aree scoperte, giardini, terrazzi.",
    percentage: 36,
    yearsRecovery: 10,
    maxAmount: 5000,
    category: "edilizia",
    normative: "L. 205/2017 art. 1 commi 12-15",
    validUntil: "31/12/2025",
    beneficiaries: ["Persone fisiche", "Condomini"],
    workTypes: [
      "Sistemazione a verde aree scoperte",
      "Realizzazione coperture a verde",
      "Realizzazione giardini pensili",
      "Impianti di irrigazione",
      "Pozzi connessi",
    ],
    required: {
      bankTransfer: true,
      enéa: false,
      asseveration: false,
      cessionAllowed: false,
      invoiceMention: "Spesa Bonus Verde L. 205/2017",
      documents: ["Bonifico tracciabile (anche non parlante)", "Fattura"],
    },
  },
  {
    type: "FURNITURE_BONUS_50",
    label: "Bonus Mobili ed Elettrodomestici 50%",
    description: "Detrazione 50% per acquisto mobili e grandi elettrodomestici (classe A+ frigo/lavatrice/lavastoviglie, A forno).",
    percentage: 50,
    yearsRecovery: 10,
    maxAmount: 5000,
    category: "edilizia",
    normative: "Art. 16 c. 2 D.L. 63/2013",
    validUntil: "31/12/2025",
    beneficiaries: ["Persone fisiche che hanno fatto ristrutturazione"],
    workTypes: [
      "Mobili (anche fissi)",
      "Frigoriferi classe ≥ E",
      "Lavatrici classe ≥ E",
      "Lavastoviglie classe ≥ E",
      "Forni classe ≥ A",
      "Apparecchi cottura",
      "Cappa cucina",
    ],
    required: {
      bankTransfer: true,
      bankTransferDescription: "Bonifico standard (non parlante) o carta credito/debito",
      enéa: true,
      enéaWithinDays: 90,
      asseveration: false,
      cessionAllowed: false,
      invoiceMention: "Spesa Bonus Mobili art. 16 c. 2 D.L. 63/2013",
      documents: [
        "Pagamento tracciato (bonifico/carta)",
        "Fattura con codice fiscale acquirente",
        "Comunicazione ENEA per elettrodomestici",
        "Documentazione ristrutturazione collegata",
      ],
    },
    notes: "Richiede di avere in corso una ristrutturazione (anche minimale). Massimale per anno solare.",
  },
  {
    type: "CONTO_TERMICO",
    label: "Conto Termico 2.0",
    description: "Incentivo GSE per piccoli interventi di efficientamento energetico e impianti a fonti rinnovabili termiche.",
    percentage: 65,
    yearsRecovery: 1,
    category: "energia",
    normative: "D.M. 16/02/2016",
    beneficiaries: ["PA", "Imprese", "Persone fisiche"],
    workTypes: [
      "Sostituzione climatizzazione invernale con pompa di calore",
      "Sostituzione scaldacqua elettrici con pompa di calore",
      "Installazione collettori solari termici",
      "Installazione caldaie a biomassa",
      "Building automation",
    ],
    required: {
      bankTransfer: false,
      enéa: false,
      asseveration: true,
      cessionAllowed: false,
      documents: [
        "Domanda telematica al GSE entro 60 giorni dalla fine lavori",
        "Scheda Domanda + Allegati tecnici",
        "Fattura con descrizione lavori",
      ],
    },
    notes: "NON è detrazione fiscale ma erogazione diretta GSE. Non cumulabile con detrazioni fiscali.",
  },
  {
    type: "PV_SELF_CONSUMPTION",
    label: "Comunità Energetiche / Autoconsumo FV",
    description: "Incentivi GSE per impianti fotovoltaici in autoconsumo e CER (Comunità Energetiche Rinnovabili).",
    percentage: 40,
    yearsRecovery: 1,
    category: "fotovoltaico",
    normative: "D.M. 7/12/2023 (CER) + D.Lgs 199/2021",
    beneficiaries: ["Persone fisiche", "Imprese", "Condomini", "PA", "Associazioni"],
    workTypes: [
      "Impianto FV su tetto",
      "Impianto FV a terra (specifiche aree)",
      "Sistemi accumulo (batterie)",
      "Inverter ibrido",
      "Smart meter",
    ],
    required: {
      bankTransfer: false,
      enéa: false,
      asseveration: false,
      cessionAllowed: false,
      documents: [
        "Allaccio in scambio sul posto o cessione",
        "Configurazione CER se applicabile",
        "Tariffa GSE su quota energia condivisa",
        "Detrazione IRPEF 50% (alternativa) sulla parte residenziale",
      ],
    },
    notes: "Combinabile con Detrazione 50% per residenziale. PNRR finanzia CER fino al 40% delle spese.",
  },
  {
    type: "DOMOTIC_BONUS_65",
    label: "Bonus Domotica 65%",
    description: "Detrazione 65% per dispositivi multimediali di controllo a distanza degli impianti.",
    percentage: 65,
    yearsRecovery: 10,
    category: "energia",
    normative: "Art. 14 c. 2-bis D.L. 63/2013",
    validUntil: "31/12/2025",
    beneficiaries: ["Persone fisiche", "Imprese"],
    workTypes: [
      "Sistemi gestione consumi energetici",
      "Termostati intelligenti",
      "Smart meter dispositivi mostro consumi",
      "Sistemi controllo accensione/spegnimento",
      "Building automation",
    ],
    required: {
      bankTransfer: true,
      enéa: true,
      enéaWithinDays: 90,
      asseveration: false,
      cessionAllowed: false,
      invoiceMention: "Spesa Ecobonus domotica art. 14 c. 2-bis D.L. 63/2013",
      documents: [
        "Bonifico parlante",
        "Fattura con riferimento normativo",
        "Comunicazione ENEA",
        "Documentazione tecnica sistema",
      ],
    },
  },
];

export function getIncentive(type: string): IncentiveDef | undefined {
  return INCENTIVES.find(i => i.type === type);
}

export function generateBankTransferText(opts: { incentive: IncentiveDef; beneficiaryFiscalCode: string; companyVat: string; invoiceNumber: string }): string {
  const def = opts.incentive;
  if (!def.required.bankTransfer) return "Non richiesto bonifico parlante per questa agevolazione.";
  const base = def.required.bankTransferDescription || `Causale: ${def.normative}`;
  return `${base}\nCF beneficiario: ${opts.beneficiaryFiscalCode}\nP.IVA azienda: ${opts.companyVat}\nRiferimento fattura: ${opts.invoiceNumber}`;
}

export function getRequiredDocuments(type: string): string[] {
  const inc = getIncentive(type);
  return inc?.required.documents || [];
}
