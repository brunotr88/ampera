/**
 * Italian labels for all status enums.
 * Use t(value) to get localized label.
 */

export const LABELS = {
  // Quote status
  DRAFT: "Bozza",
  SENT: "Inviato",
  VIEWED: "Visualizzato",
  ACCEPTED: "Accettato",
  REJECTED: "Rifiutato",
  EXPIRED: "Scaduto",
  CONVERTED: "Convertito",

  // Invoice payment status
  UNPAID: "Da incassare",
  PARTIAL: "Parziale",
  PAID: "Incassata",
  OVERDUE: "Scaduta",
  DISPUTED: "Contestata",

  // SDI status
  QUEUED: "In coda",
  DELIVERED: "Consegnata",
  NOT_DELIVERED: "Non consegnata",

  // Work Order status
  SCHEDULED: "Programmato",
  IN_PROGRESS: "In corso",
  PAUSED: "In pausa",
  COMPLETED: "Completato",
  CANCELLED: "Annullato",
  EMERGENCY: "Emergenza",

  // Report status
  SUBMITTED: "Firmato",
  INVOICED: "Fatturato",
  ARCHIVED: "Archiviato",

  // Priority
  LOW: "Bassa",
  NORMAL: "Normale",
  URGENT: "Urgente",

  // Project status
  ACTIVE: "Attivo",
  ON_HOLD: "Sospeso",
  CLOSED: "Chiuso",

  // DICO status
  COMPLETE: "Completa",
  ISSUED: "Emessa",
  SENT_TO_INAIL: "Inviata INAIL",

  // Purchase Order status
  CONFIRMED: "Confermato",
  RECEIVED: "Ricevuto",

  // Vacation
  PENDING: "In attesa",
  APPROVED: "Approvata",

  // Vacation type
  VACATION: "Ferie",
  PERMIT: "Permesso",
  ILLNESS: "Malattia",
  TRAINING: "Formazione",
  LEAVE_104: "L. 104",
  PARENTAL: "Genitoriale",
  OTHER: "Altro",

  // Customer
  PRIVATE: "Privato",
  BUSINESS: "Azienda",
  CONDOMINIUM: "Condominio",
  PUBLIC_ADMIN: "PA",
  PROSPECT: "Prospect",
  INACTIVE: "Inattivo",
  BLOCKED: "Bloccato",

  // Role
  OWNER: "Titolare",
  ADMIN: "Amministratore",
  OFFICE: "Ufficio",
  TECHNICIAN: "Tecnico",
  VIEWER: "Solo lettura",
  CUSTOMER: "Cliente",

  // Plant types
  CIVIL: "Civile",
  INDUSTRIAL: "Industriale",
  PHOTOVOLTAIC: "Fotovoltaico",
  DOMOTIC: "Domotica",
  FIRE_ALARM: "Antincendio",
  HVAC: "HVAC",
  CHARGING_STATION: "Colonnina ricarica",
  TLC: "TLC",

  // Stock movement
  IN: "Carico",
  OUT: "Scarico",
  TRANSFER: "Trasferimento",
  ADJUSTMENT: "Rettifica",
  RETURN: "Reso",

  // Calendar event
  MEETING: "Riunione",
  CALL: "Chiamata",
  TASK: "Attivita",
  INSPECTION: "Sopralluogo",
  DEADLINE: "Scadenza",
  REMINDER: "Promemoria",

  // Cashbox type
  CASH: "Contanti",
  BANK: "Banca",
  CREDIT_CARD: "Carta credito",
  POS: "POS",
  PAYPAL: "PayPal",
  STRIPE: "Stripe",

  // Cashbook direction
  // IN/OUT also valid here

  // Incentive status
  ELIGIBLE: "Idoneo",
  DOCUMENTS_READY: "Documenti pronti",
  BANK_TRANSFER_DONE: "Bonifico effettuato",
  ENEA_SUBMITTED: "Inviato ENEA",

  // Invoice type
  INVOICE: "Fattura",
  CREDIT_NOTE: "Nota credito",
  PROFORMA: "Proforma",
  TD24_DEFERRED: "Differita",
  TD20_SELF: "Autofattura",

  // Address type
  MAIN: "Principale",
  LEGAL: "Legale",
  OPERATIONAL: "Operativa",
  BILLING: "Fatturazione",

  // Warehouse type
  HQ: "Sede",
  VAN: "Furgone",
  SITE: "Cantiere",
  VIRTUAL: "Virtuale",

  // Privacy doc type
  CUSTOMER_INFORMATIVE: "Informativa cliente",
  CUSTOMER_CONSENT: "Consenso cliente",
  EMPLOYEE_INFORMATIVE: "Informativa dipendente",
  EMPLOYEE_CONSENT: "Consenso dipendente",
  CONTRACTOR_NDA: "NDA fornitore",
  MARKETING_CONSENT: "Consenso marketing",
  COOKIE_BANNER: "Cookie banner",
  DATA_PROCESSING_AGREEMENT: "DPA",
  CCTV_INFORMATIVE: "Informativa videosorveglianza",
  GEO_TRACKING_CONSENT: "Consenso geolocalizzazione",
  CUSTOM: "Personalizzato",

  // Attachment category
  GENERAL: "Generico",
  PHOTO: "Foto",
  PDF: "PDF",
  DICO: "DICO",
  CERTIFICATE: "Certificato",
  CONTRACT: "Contratto",
  PRIVACY_CONSENT: "Consenso privacy",
  ID_DOCUMENT: "Documento identita",
  INVOICE_ATTACHMENT: "Allegato fattura",
  PROJECT_PLAN: "Planimetria",
  TECHNICAL_DRAWING: "Schema tecnico",
  SAFETY_DOC: "Sicurezza",
  REPORT_PDF: "Rapportino PDF",

  // Audience
  PUBLIC: "Pubblico",
  OPERATOR: "Operatore",

  // Reminder
  EMAIL: "Email",
  PUSH: "Push",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
  FAILED: "Fallito",
  CONFIRMED_EVENT: "Confermato",
  TENTATIVE: "Provvisorio",
} as const;

/** Get italian label for any enum value, fallback to the value itself */
export function t(value: string | null | undefined): string {
  if (!value) return "—";
  return (LABELS as Record<string, string>)[value] || value;
}


/** Alias di t() per evitare conflitti col minifier SWC */
export const tr = t;
