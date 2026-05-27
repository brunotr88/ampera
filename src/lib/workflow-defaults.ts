/** Stati workflow default da auto-bootstrap per ogni tenant nuovo. */

export type WorkflowStateScope = "WORKORDER" | "PROJECT" | "REPORT";

export interface DefaultStateSeed {
  scope: WorkflowStateScope;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  percentage: number;
  sortOrder: number;
  isFinal?: boolean;
  triggersClientEmail?: boolean;
  emailSubject?: string;
  emailBodyHtml?: string;
}

export const DEFAULT_WORKFLOW_STATES: DefaultStateSeed[] = [
  // WorkOrder workflow (intervento elettrico)
  {
    scope: "WORKORDER", name: "Programmato", description: "Intervento confermato in agenda",
    color: "#3B82F6", icon: "calendar", percentage: 10, sortOrder: 1,
    triggersClientEmail: true,
    emailSubject: "Intervento confermato - {{workOrder.code}}",
    emailBodyHtml: `<p>Gentile {{customer.name}},</p>
<p>Confermiamo l'appuntamento per l'intervento <strong>{{workOrder.code}}</strong> presso {{plant.address}}.</p>
<p>Data programmata: <strong>{{workOrder.scheduledDate}}</strong></p>
<p>Tecnico incaricato: {{workOrder.assignedTo.name}}</p>
<p>Puoi seguire lo stato in tempo reale qui: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
<p>Cordiali saluti,<br>{{tenant.name}}</p>`,
  },
  {
    scope: "WORKORDER", name: "Sopralluogo in corso", description: "Tecnico sul posto per valutazione",
    color: "#F59E0B", icon: "search", percentage: 25, sortOrder: 2,
  },
  {
    scope: "WORKORDER", name: "Materiale ordinato", description: "Componenti in arrivo dal fornitore",
    color: "#8B5CF6", icon: "package", percentage: 40, sortOrder: 3,
    triggersClientEmail: true,
    emailSubject: "Aggiornamento intervento - {{workOrder.code}}",
    emailBodyHtml: `<p>Gentile {{customer.name}},</p>
<p>Aggiornamento sul tuo intervento <strong>{{workOrder.code}}</strong>:</p>
<p>Abbiamo ordinato il materiale necessario. Ti aggiorneremo non appena ricevuto.</p>
<p>Stato avanzamento: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p>
<p>{{tenant.name}}</p>`,
  },
  {
    scope: "WORKORDER", name: "Lavori in corso", description: "Esecuzione intervento",
    color: "#10B981", icon: "wrench", percentage: 60, sortOrder: 4,
  },
  {
    scope: "WORKORDER", name: "Collaudo", description: "Test funzionalità e sicurezza CEI 64-8",
    color: "#06B6D4", icon: "check-circle", percentage: 85, sortOrder: 5,
  },
  {
    scope: "WORKORDER", name: "Completato", description: "Intervento concluso, in attesa fatturazione",
    color: "#22C55E", icon: "check-square", percentage: 100, sortOrder: 6, isFinal: true,
    triggersClientEmail: true,
    emailSubject: "Intervento completato - {{workOrder.code}}",
    emailBodyHtml: `<p>Gentile {{customer.name}},</p>
<p>L'intervento <strong>{{workOrder.code}}</strong> è stato completato con successo.</p>
<p>A breve riceverai la documentazione (DICO se applicabile) e la fattura.</p>
<p>Grazie per averci scelto.<br>{{tenant.name}}</p>`,
  },

  // Project workflow (commessa)
  { scope: "PROJECT", name: "Da preventivare", color: "#94A3B8", percentage: 5, sortOrder: 1 },
  { scope: "PROJECT", name: "Preventivo inviato", color: "#3B82F6", percentage: 15, sortOrder: 2 },
  { scope: "PROJECT", name: "Approvato", color: "#10B981", percentage: 25, sortOrder: 3, triggersClientEmail: true },
  { scope: "PROJECT", name: "In esecuzione", color: "#F59E0B", percentage: 60, sortOrder: 4 },
  { scope: "PROJECT", name: "Collaudo finale", color: "#06B6D4", percentage: 85, sortOrder: 5 },
  { scope: "PROJECT", name: "Chiusa", color: "#22C55E", percentage: 100, sortOrder: 6, isFinal: true, triggersClientEmail: true },
];
