import type { PageHelpData } from "@/components/app/page-help";

export const HELP: Record<string, PageHelpData> = {
  dashboard: {
    title: "Dashboard",
    intro: "La home del titolare: KPI realtime, interventi aperti, ultimi rapportini e appuntamenti in arrivo. Tutto cliccabile.",
    tips: [
      { title: "KPI cliccabili", body: "Tocca un riquadro per filtrare la lista corrispondente." },
      { title: "Quick actions", body: "Le 6 azioni veloci in basso a destra coprono il 90% delle operazioni quotidiane.", shortcut: "Ctrl+K" },
      { title: "Scadenze 30 gg", body: "Manutenzioni e DICO in scadenza appaiono automaticamente nei riquadri di alert." },
    ],
    shortcuts: [{ keys: "Ctrl+K", label: "Ricerca globale" }, { keys: "G N", label: "Nuovo cliente" }, { keys: "G P", label: "Nuovo preventivo" }],
  },
  customers: {
    title: "Clienti",
    intro: "Anagrafica unica per B2C, B2B, condomini e PA. Cambi tipo in alto per vedere solo i campi pertinenti.",
    tips: [
      { title: "Tag intelligenti", body: "Usa tag come 'VIP', 'moroso', 'ricorrente' per filtrare velocemente nelle viste future." },
      { title: "GDPR built-in", body: "Spunta il consenso al primo contatto: la data viene loggata e il dato resta tracciato." },
      { title: "Lookup P.IVA", body: "Inserisci la P.IVA: il sistema valida l'algoritmo italiano di 11 cifre prima del salvataggio." },
      { title: "Importa CSV", body: "Per import massivi usa il pulsante 'Importa' (admin only) o l'API /api/customers." },
    ],
    shortcuts: [{ keys: "/", label: "Cerca cliente" }, { keys: "N", label: "Nuovo cliente" }],
  },
  customer_detail: {
    title: "Scheda cliente",
    intro: "Vista 360°: anagrafica, sedi, impianti, commesse, fatturato totale, interventi storici.",
    tips: [
      { title: "Azioni rapide", body: "I 3 bottoni in alto: nuovo impianto, intervento e preventivo. Tutti pre-compilati col cliente." },
      { title: "Storico fatturato", body: "Mostra YTD e da incassare. Tocca per aprire la lista fatture filtrata." },
      { title: "Plant first-class", body: "Ogni impianto ha vita propria: DICO, manutenzioni, storico interventi linkato all'impianto, non al cliente." },
    ],
  },
  plants: {
    title: "Impianti",
    intro: "Gli impianti sono entità di prima classe: ogni impianto ha tipo (civile, industriale, FV...), potenza, scadenze verifiche DPR 462.",
    tips: [
      { title: "Tipi configurabili", body: "9 tipi predefiniti coprono il settore IT: civile, industriale, FV, domotica, emergenza, antincendio, HVAC, colonnine, TLC." },
      { title: "Scadenze 462", body: "Se inserisci 'Prossima verifica', dashboard e calendar ti avviseranno 30 giorni prima." },
      { title: "Foto e DICO archiviate", body: "Da scheda impianto puoi caricare allegati: schemi, planimetrie, fotografie del quadro." },
    ],
  },
  reports: {
    title: "Rapportini",
    intro: "Vista admin: lista di tutti i rapportini chiusi dai tecnici. Stampa PDF, converti in fattura, gestisci stato.",
    tips: [
      { title: "Filtri stato", body: "DRAFT = compilato non firmato · SUBMITTED = chiuso firmato · INVOICED = fattura emessa." },
      { title: "Stampa rapida", body: "Icona stampante apre direttamente il PDF in nuova tab con auto-print dialog." },
      { title: "Convertici in fattura", body: "Dalla scheda rapportino il pulsante 'Fattura' precompila TUTTO da ore e materiali." },
      { title: "Modifica post-firma", body: "I rapportini firmati sono immutable. Per correzioni: usa nota credito o crea nuovo rapportino integrativo." },
    ],
    shortcuts: [{ keys: "Ctrl+P", label: "Stampa rapportino" }],
  },
  quotes: {
    title: "Preventivi",
    intro: "Pipeline preventivi con versioning (v1, v2, v3) e firma digitale remota via link share.",
    tips: [
      { title: "Sconto globale o per riga", body: "Imposta sconto globale % oppure sconto per singola riga, sia in % sia in valore €." },
      { title: "IVA differenziata", body: "Ogni riga può avere IVA diversa (10% ristrutturazioni, 22% nuovo, 4% accessibilità)." },
      { title: "Template salvabili", body: "Trasforma un preventivo in template ('bilocale standard') riutilizzabile in 1 click." },
      { title: "Stato pipeline", body: "DRAFT → SENT → VIEWED → ACCEPTED. Tracking apertura via pixel email." },
    ],
  },
  invoices: {
    title: "Fatture",
    intro: "Fatturazione elettronica conforme SDI. Genera XML FatturaPA 1.9.1, stampa PDF, traccia incassi.",
    tips: [
      { title: "Tipi documento", body: "TD01 fattura standard · TD04 nota credito · TD06 proforma · TD24 differita · TD20 autofattura." },
      { title: "Reverse charge", body: "Spunta la checkbox per applicare reverse charge edilizia (art. 17 c. 6 DPR 633/72)." },
      { title: "Bollo virtuale", body: "Si applica per importi > 77,47€ esenti IVA. Aggiungi 2€ a totale fattura." },
      { title: "Registra incasso", body: "Dalla scheda fattura 'Registra incasso' crea automaticamente movimento in Prima Nota." },
    ],
  },
  cashbook: {
    title: "Prima Nota",
    intro: "Cash flow giorno per giorno: tutte le entrate e uscite di cassa, banca, POS, carte.",
    tips: [
      { title: "Multi-cassa", body: "Crea casse separate: contanti, banca, POS, PayPal. I saldi si aggiornano automaticamente." },
      { title: "Collega a fattura", body: "Se entrata collegata a fattura, lo stato della fattura passa automaticamente a PAID/PARTIAL." },
      { title: "Categorie", body: "Categorizza le spese per generare report fiscali e tracciare costi indiretti per commessa." },
    ],
  },
  purchase_orders: {
    title: "Ordini Fornitori",
    intro: "Ordini ai grossisti con ricezione merce direttamente al magazzino selezionato.",
    tips: [
      { title: "Codici METEL", body: "Inserisci il codice METEL del materiale: viene linkato automaticamente all'articolo se presente in catalogo." },
      { title: "Ricezione parziale", body: "Puoi confermare ricezione di quantità inferiori all'ordine: lo stato passa a PARTIAL." },
      { title: "Carico automatico", body: "Alla conferma ricevimento, il magazzino selezionato viene aggiornato con StockMovement IN." },
    ],
  },
  warehouse: {
    title: "Magazzino",
    intro: "Multi-magazzino: HQ + N furgoni assegnati ai tecnici. Movimenti tracciati con riferimento commessa/rapportino.",
    tips: [
      { title: "Furgoni come magazzini", body: "Crea un magazzino tipo VAN per ogni furgone. Assegnalo a un tecnico." },
      { title: "Scarico automatico", body: "Quando un rapportino viene firmato, i materiali usati vengono scaricati automaticamente dal magazzino del tecnico." },
      { title: "Trasferimenti", body: "Movimento tipo TRANSFER per spostare merce HQ → furgone → cantiere." },
    ],
  },
  materials: {
    title: "Articoli",
    intro: "Catalogo articoli con codice interno, codice METEL, barcode, prezzo, margine.",
    tips: [
      { title: "Codice METEL", body: "Standard di settore per scambio listini grossisti. 6 cifre + 4 prefisso fornitore." },
      { title: "Margine configurabile", body: "Imposta margine % per articolo: il prezzo vendita si calcola automaticamente dal prezzo acquisto." },
      { title: "Scorta minima", body: "Imposta soglia: ricevi alert quando lo stock scende sotto. Riordino con un clic." },
    ],
  },
  calendar: {
    title: "Calendario",
    intro: "Appuntamenti azienda con promemoria email automatici. Per gli interventi tecnici usa 'Interventi'.",
    tips: [
      { title: "Promemoria email", body: "Imposta minuti prima: ricevi email all'owner dell'evento. Default 60 min." },
      { title: "Vista mese/lista", body: "Sopra vista mensile, sotto lista cronologica prossimi 14 giorni." },
      { title: "Tipi evento", body: "MEETING, CALL, TASK, INSPECTION (sopralluogo), DEADLINE, REMINDER." },
    ],
  },
  vacations: {
    title: "Ferie & Permessi",
    intro: "Workflow approvazione: tecnico richiede, admin/owner approva o rifiuta. Notifiche email automatiche.",
    tips: [
      { title: "Mezza giornata", body: "Spunta 'mezza giornata inizio/fine' per richieste granulari (es. permesso pomeridiano)." },
      { title: "Tipi", body: "Ferie · Permesso · Malattia · Formazione · Legge 104 · Genitoriale · Altro." },
      { title: "Notifica giorni prima", body: "Imposta giorni anticipo: tecnico riceve reminder via email." },
    ],
  },
  faq: {
    title: "FAQ - Knowledge Base",
    intro: "Domande frequenti per amministratori, operatori e clienti del portale.",
    tips: [
      { title: "Filtra per pubblico", body: "Tab ADMIN/OPERATOR/CUSTOMER mostrano solo le FAQ pertinenti al ruolo." },
      { title: "Cerca", body: "La ricerca trova nella domanda, risposta e tag." },
      { title: "Vota utilità", body: "👍 / 👎 in fondo a ogni FAQ aiuta a migliorare la documentazione." },
    ],
  },
  settings: {
    title: "Impostazioni",
    intro: "Dati azienda, utenti del workspace, ruoli RBAC, sicurezza.",
    tips: [
      { title: "Dati fattura", body: "P.IVA, codice SDI, PEC, IBAN appaiono in tutte le fatture e preventivi generati." },
      { title: "Ruoli RBAC", body: "OWNER (tutto + billing) · ADMIN (tutto) · OFFICE (no impostazioni) · TECHNICIAN (solo suoi WO) · VIEWER (read-only)." },
      { title: "Tema", body: "L'utente sceglie chiaro/scuro/sistema dall'icona in alto. Le preferenze sono per-utente." },
    ],
  },
  incentives: {
    title: "Agevolazioni Fiscali",
    intro: "Bonus 50%, Ecobonus 65%, Sismabonus, Colonnine 80%, Barriere 75%, Conto Termico. Auto-compilazione documenti.",
    tips: [
      { title: "Bonifico parlante", body: "Per detrazioni serve bonifico con dicitura specifica. Generiamo testo bonifico pronto da copiare/inviare al cliente." },
      { title: "Comunicazione ENEA", body: "Obbligatoria entro 90 gg dalla fine lavori per Ecobonus, Bonus Mobili e Detrazione 50% se include risparmio energetico." },
      { title: "Asseverazione tecnica", body: "Richiesta per Superbonus 110% (in chiusura). Spunta checkbox per evidenziarla nei documenti." },
      { title: "Cessione/Sconto", body: "Indica se la detrazione è in cessione del credito o sconto in fattura (sempre più limitati dal 2024)." },
    ],
  },
  privacy: {
    title: "Privacy & GDPR",
    intro: "Genera informative GDPR per clienti, operatori (dipendenti), CCTV. Raccogli consensi firmati digitalmente.",
    tips: [
      { title: "Modello pronto", body: "Templates conformi GDPR (Reg. UE 2016/679) + D.Lgs 196/03. Personalizza i campi azienda e stampa." },
      { title: "Consenso tracciato", body: "Quando il cliente firma, salviamo firma + data + IP + user-agent. Audit-trail completo." },
      { title: "Periodicità", body: "Aggiorna le informative ogni anno: il campo 'version' tiene traccia delle revisioni." },
      { title: "Geo-tracking", body: "Per tecnici con GPS attivo serve consenso esplicito. Genera il modulo dedicato in 1 click." },
    ],
  },
  operatore_home: {
    title: "Area Operatore",
    intro: "Tutto quello che ti serve in cantiere. Touch-friendly, funziona offline, salva la batteria.",
    tips: [
      { title: "Inizia giornata", body: "Timbra l'ingresso con GPS. La posizione viene registrata e viene tracciato l'inizio della giornata lavorativa." },
      { title: "Tocca cliente per navigare", body: "Tap su indirizzo apre Google Maps con la rotta già impostata." },
      { title: "Tap telefono per chiamare", body: "Tap sul numero del cliente parte la chiamata diretta." },
      { title: "Status colori", body: "🔵 programmato · 🟠 in corso · 🟢 chiuso · 🔴 emergenza." },
    ],
  },
  operatore_report: {
    title: "Compilazione Rapportino",
    intro: "Wizard 6 step, < 90 secondi per chiudere un intervento standard. Funziona offline.",
    tips: [
      { title: "🎤 Dettatura vocale", body: "Tap il microfono nello step 3: parli in italiano e il testo appare. Risparmio enorme in cantiere." },
      { title: "Stepper ore", body: "Step 4: usa + e − per impostare ore in mezz'ore. Più veloce della tastiera." },
      { title: "Materiali recenti", body: "I tuoi ultimi 8 articoli usati sono sempre in cima per 1-tap add." },
      { title: "Foto + GPS", body: "Step 6: ogni foto viene salvata con coordinate GPS automaticamente. Useless metadata? No: prova certifica intervento." },
      { title: "Firma fullscreen", body: "Tocca area firma: si apre fullscreen ottimizzata per pennino o dito. Cliente firma direttamente sullo smartphone." },
      { title: "Offline-first", body: "Se rete assente, il rapportino viene salvato in locale. Si sincronizza quando torna connessione." },
    ],
  },
};
