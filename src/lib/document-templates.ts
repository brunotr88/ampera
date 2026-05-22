/**
 * Catalogo template documenti standard a tutela dell'azienda.
 * 15 modelli pre-impostati per uso elettrico in Italia.
 *
 * Placeholders supportati:
 *   {{tenant.name}} {{tenant.address}} {{tenant.vatNumber}} {{tenant.email}} {{tenant.phone}}
 *   {{customer.name}} {{customer.surname}} {{customer.companyName}} {{customer.address}}
 *   {{customer.fiscalCode}} {{customer.vatNumber}} {{customer.email}} {{customer.phone}}
 *   {{plant.name}} {{plant.code}} {{plant.type}} {{plant.address}}
 *   {{workOrder.code}} {{workOrder.title}} {{workOrder.scheduledDate}}
 *   {{date}} {{dateLong}} {{time}} {{year}}
 *   {{technician.name}} {{user.name}}
 *   {{custom.field}} - campi liberi
 */

export type DocumentCategory =
  | "SOPRALLUOGO"
  | "INCARICO"
  | "INIZIO_LAVORI"
  | "FINE_LAVORI"
  | "COLLAUDO"
  | "CONSEGNA"
  | "NON_CONFORMITA"
  | "MANCATO_ACCESSO"
  | "RIFIUTO"
  | "SAL"
  | "GARANZIA"
  | "RELAZIONE_TECNICA"
  | "VERIFICA_DPR462"
  | "FORMAZIONE"
  | "ALTRO";

export type SystemTemplate = {
  code: string;
  title: string;
  category: DocumentCategory;
  description: string;
  bodyTemplate: string;
  requireSignature: boolean;
  signerRole: "CUSTOMER" | "EMPLOYEE" | "BOTH" | "NONE";
  legalReference?: string;
  audience: "CUSTOMER" | "EMPLOYEE" | "BOTH";
};

const baseStyles = `<style>
body{font-family:'Inter',Arial,sans-serif;color:#111;line-height:1.55;font-size:14px;}
h1{font-size:20px;margin:0 0 8px;color:#0a4080;border-bottom:2px solid #0a4080;padding-bottom:6px;}
h2{font-size:15px;margin:18px 0 6px;color:#0a4080;}
.head{display:flex;justify-content:space-between;margin-bottom:18px;font-size:12px;}
.party{padding:10px;background:#f5f7fa;border-left:3px solid #0a4080;margin:8px 0;}
.box{border:1px solid #ddd;padding:12px;border-radius:6px;margin:10px 0;}
.warn{background:#fff8ec;border-left:3px solid #d97706;padding:10px;font-size:13px;}
.legal{font-size:11px;color:#555;font-style:italic;margin-top:14px;}
table{width:100%;border-collapse:collapse;margin:10px 0;}
td,th{border:1px solid #ccc;padding:6px;font-size:12px;text-align:left;}
.sig{margin-top:30px;display:flex;justify-content:space-between;}
.sig div{width:45%;border-top:1px solid #888;padding-top:6px;font-size:12px;}
</style>`;

const header = `<div class="head">
  <div>
    <strong>{{tenant.name}}</strong><br>
    {{tenant.address}}<br>
    P.IVA {{tenant.vatNumber}} · {{tenant.email}}
  </div>
  <div style="text-align:right;">
    {{date}}<br>
    Prot. n. {{doc.code}}
  </div>
</div>`;

const parties = `<div class="party">
  <strong>Cliente:</strong> {{customer.companyName}}{{customer.name}} {{customer.surname}}<br>
  {{customer.address}}<br>
  C.F./P.IVA: {{customer.fiscalCode}}{{customer.vatNumber}}<br>
  Tel: {{customer.phone}} · Email: {{customer.email}}
</div>`;

export const SYSTEM_DOCUMENT_TEMPLATES: SystemTemplate[] = [
  {
    code: "VERBALE_SOPRALLUOGO",
    title: "Verbale di sopralluogo tecnico",
    category: "SOPRALLUOGO",
    description: "Documenta lo stato dei luoghi prima dell'intervento. Tutela in caso di contestazioni su preesistenze.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    legalReference: "Art. 1655 cc",
    bodyTemplate: `${baseStyles}
<h1>Verbale di sopralluogo tecnico</h1>
${header}
${parties}
<h2>Oggetto del sopralluogo</h2>
<p>{{custom.subject}}</p>
<h2>Impianto / Cantiere</h2>
<p><strong>{{plant.name}}</strong> ({{plant.type}})<br>
Ubicazione: {{plant.address}}</p>
<h2>Stato dei luoghi rilevato</h2>
<div class="box">{{custom.stateDescription}}</div>
<h2>Anomalie / pre-esistenze rilevate</h2>
<div class="warn">
{{custom.preexistingIssues}}
<br><br><em>Le pre-esistenze rilevate non sono di responsabilità della ditta scrivente e saranno oggetto di valutazione separata se richieste opere di adeguamento.</em>
</div>
<h2>Documenti tecnici richiesti / consegnati</h2>
<p>{{custom.documents}}</p>
<p class="legal">Il presente verbale ha valore di documentazione contrattuale ai sensi dell'art. 1655 e ss. cc. La sottoscrizione attesta la veridicità di quanto sopra rilevato in contraddittorio tra le parti.</p>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div>Il Cliente<br>(firma)</div></div>`,
  },

  {
    code: "PROPOSTA_INTERVENTO",
    title: "Proposta tecnica di intervento",
    category: "INCARICO",
    description: "Proposta formale di lavori con descrizione, tempi e condizioni. A tutela in caso di varianti/contestazioni.",
    requireSignature: true, signerRole: "CUSTOMER", audience: "CUSTOMER",
    bodyTemplate: `${baseStyles}
<h1>Proposta tecnica di intervento</h1>
${header}
${parties}
<h2>Descrizione lavori proposti</h2>
<div class="box">{{custom.workDescription}}</div>
<h2>Tempi previsti</h2>
<p>Inizio: {{custom.startDate}} · Durata stimata: {{custom.duration}}</p>
<h2>Importo</h2>
<p>Stima € {{custom.amount}} oltre IVA come da preventivo n. {{custom.quoteNumber}}</p>
<h2>Condizioni</h2>
<ul>
<li>La presente proposta è valida 30 giorni dalla data di emissione</li>
<li>Eventuali varianti richieste in corso d'opera saranno quotate separatamente</li>
<li>I tempi possono variare per cause non imputabili alla ditta (forniture, accesso ai luoghi)</li>
</ul>
<p class="legal">Per accettazione della proposta apporre firma in calce. L'accettazione vincola alle condizioni sopra esposte.</p>
<div class="sig"><div>La Ditta<br>{{tenant.name}}</div><div>Per accettazione il Cliente<br>(firma)</div></div>`,
  },

  {
    code: "LETTERA_INCARICO",
    title: "Lettera di incarico professionale",
    category: "INCARICO",
    description: "Conferimento incarico per progettazione/direzione lavori/responsabile tecnico.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    legalReference: "Art. 2222 cc",
    bodyTemplate: `${baseStyles}
<h1>Lettera di incarico professionale</h1>
${header}
${parties}
<p>Con la presente il sottoscritto Cliente conferisce a {{tenant.name}} l'incarico professionale per:</p>
<div class="box">{{custom.scope}}</div>
<h2>Compenso</h2>
<p>{{custom.fee}}</p>
<h2>Modalità di esecuzione</h2>
<p>{{custom.execution}}</p>
<h2>Durata e scadenze</h2>
<p>{{custom.timeline}}</p>
<h2>Recesso</h2>
<p>Le parti possono recedere con preavviso scritto di 30 giorni. In caso di recesso del Cliente, è dovuto il compenso per le attività svolte fino a quel momento.</p>
<p class="legal">Riferimento: art. 2222 cc (prestazione d'opera) - art. 1722 cc (mandato).</p>
<div class="sig"><div>Il Professionista<br>{{tenant.name}}</div><div>Il Committente<br>{{customer.name}} {{customer.surname}}{{customer.companyName}}</div></div>`,
  },

  {
    code: "VERBALE_INIZIO_LAVORI",
    title: "Verbale di inizio lavori",
    category: "INIZIO_LAVORI",
    description: "Documenta inizio cantiere e consegna area al tecnico.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    bodyTemplate: `${baseStyles}
<h1>Verbale di inizio lavori</h1>
${header}
${parties}
<p>In data {{dateLong}} si dà inizio ai lavori presso:</p>
<p><strong>{{plant.name}}</strong> · {{plant.address}}</p>
<h2>Riferimento</h2>
<p>Intervento {{workOrder.code}} · {{workOrder.title}}<br>
Contratto/Preventivo: {{custom.contractRef}}</p>
<h2>Consegna area</h2>
<p>Il Cliente consegna l'area di lavoro alla ditta nelle condizioni di seguito descritte:</p>
<div class="box">{{custom.areaCondition}}</div>
<h2>Servizi disponibili</h2>
<p>{{custom.services}}</p>
<h2>Sicurezza</h2>
<p>{{custom.safety}}</p>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div>Il Cliente<br>(firma)</div></div>`,
  },

  {
    code: "VERBALE_FINE_LAVORI",
    title: "Verbale di fine lavori",
    category: "FINE_LAVORI",
    description: "Conclusione lavori, conformità rispetto al preventivato.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    bodyTemplate: `${baseStyles}
<h1>Verbale di fine lavori</h1>
${header}
${parties}
<p>In data {{dateLong}} si dichiara terminato l'intervento descritto in:</p>
<p>{{workOrder.code}} · <em>{{workOrder.title}}</em></p>
<h2>Lavorazioni eseguite</h2>
<div class="box">{{custom.workDone}}</div>
<h2>Materiali impiegati</h2>
<p>{{custom.materials}}</p>
<h2>Documenti consegnati al Cliente</h2>
<ul>
<li>Dichiarazione di Conformità DM 37/08 (DICO) n. {{custom.dicoNumber}}</li>
<li>Schema unifilare aggiornato</li>
<li>Relazione tecnica</li>
<li>{{custom.otherDocs}}</li>
</ul>
<h2>Garanzia</h2>
<p>L'opera è garantita per 24 mesi dalla data di fine lavori per vizi e difetti (art. 1667 cc) e per 10 anni per gravi difetti strutturali (art. 1669 cc).</p>
<div class="sig"><div>La Ditta<br>{{tenant.name}}</div><div>Il Cliente per ricevuta<br>(firma)</div></div>`,
  },

  {
    code: "VERBALE_CONSEGNA",
    title: "Verbale di consegna impianto",
    category: "CONSEGNA",
    description: "Consegna formale impianto funzionante al cliente.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    bodyTemplate: `${baseStyles}
<h1>Verbale di consegna impianto</h1>
${header}
${parties}
<h2>Impianto consegnato</h2>
<p><strong>{{plant.name}}</strong> · Tipo {{plant.type}} · Codice {{plant.code}}</p>
<h2>Caratteristiche tecniche</h2>
<p>{{custom.techSpecs}}</p>
<h2>Prove e verifiche eseguite</h2>
<ul>
<li>Continuità conduttori protezione</li>
<li>Isolamento impianto</li>
<li>Differenziali (Iₐ, t)</li>
<li>Anello di guasto / impedenza</li>
<li>{{custom.additionalTests}}</li>
</ul>
<h2>Istruzioni d'uso consegnate</h2>
<p>{{custom.instructions}}</p>
<div class="warn">Il Cliente dichiara di aver ricevuto l'impianto perfettamente funzionante e di averne preso visione del funzionamento e dei dispositivi di sicurezza.</div>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div>Per ricevuta il Cliente<br>(firma)</div></div>`,
  },

  {
    code: "VERBALE_COLLAUDO",
    title: "Verbale di collaudo positivo",
    category: "COLLAUDO",
    description: "Collaudo impianto con esito positivo, prove eseguite.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    legalReference: "CEI 64-8/6",
    bodyTemplate: `${baseStyles}
<h1>Verbale di collaudo</h1>
${header}
${parties}
<p>Collaudo eseguito il {{dateLong}} sull'impianto:</p>
<p><strong>{{plant.name}}</strong> · {{plant.address}}</p>
<h2>Prove strumentali (CEI 64-8 sez. 6)</h2>
<table>
<tr><th>Prova</th><th>Valore misurato</th><th>Limite</th><th>Esito</th></tr>
<tr><td>Continuità PE</td><td>{{custom.peContinuity}}</td><td>&lt; 1 Ω</td><td>{{custom.peEsito}}</td></tr>
<tr><td>Isolamento</td><td>{{custom.insulation}}</td><td>&gt; 1 MΩ</td><td>{{custom.insulationEsito}}</td></tr>
<tr><td>Diff. Iₐ</td><td>{{custom.diffIa}}</td><td>≤ In</td><td>{{custom.diffEsito}}</td></tr>
<tr><td>Diff. t</td><td>{{custom.diffT}}</td><td>≤ 0,3s</td><td>{{custom.diffTEsito}}</td></tr>
<tr><td>Impedenza anello</td><td>{{custom.zLoop}}</td><td>{{custom.zLimit}}</td><td>{{custom.zEsito}}</td></tr>
</table>
<h2>Strumentazione</h2>
<p>{{custom.instruments}}</p>
<h2>Esito complessivo</h2>
<p style="font-size:18px;color:#16a34a;font-weight:bold;">✓ COLLAUDO POSITIVO</p>
<p class="legal">Conformità verificata secondo CEI 64-8 parte 6 e CEI 0-21 (se FV). Documento parte integrante della DICO.</p>
<div class="sig"><div>Il Tecnico collaudatore<br>{{technician.name}}</div><div>Il Cliente<br>(firma)</div></div>`,
  },

  {
    code: "VERBALE_NON_CONFORMITA",
    title: "Verbale di non conformità preesistente",
    category: "NON_CONFORMITA",
    description: "TUTELA: rilevazione anomalie su impianto esistente NON oggetto dell'intervento. Esonera la ditta da responsabilità su quanto non rifatto.",
    requireSignature: true, signerRole: "CUSTOMER", audience: "CUSTOMER",
    legalReference: "CEI 64-8 / DM 37/08",
    bodyTemplate: `${baseStyles}
<h1>Verbale di non conformità rilevata su impianto preesistente</h1>
${header}
${parties}
<div class="warn">
<strong>⚠ COMUNICAZIONE IMPORTANTE</strong><br>
In sede di intervento è stata rilevata la presenza delle non conformità di seguito descritte, relative all'impianto esistente e <strong>NON oggetto del presente intervento</strong>. La ditta declina ogni responsabilità per dette anomalie e raccomanda al Cliente di provvedere al loro adeguamento normativo.
</div>
<h2>Impianto</h2>
<p><strong>{{plant.name}}</strong> · {{plant.address}}</p>
<h2>Non conformità rilevate</h2>
<div class="box">{{custom.nonConformities}}</div>
<h2>Rischi correlati</h2>
<p>{{custom.risks}}</p>
<h2>Riferimenti normativi violati</h2>
<p>{{custom.normViolations}}</p>
<h2>Raccomandazioni</h2>
<p>{{custom.recommendations}}</p>
<p class="legal">Ai sensi del DM 37/08 e CEI 64-8, le anomalie sopra elencate richiedono intervento di adeguamento da parte di tecnico abilitato. La ditta scrivente è disponibile a fornire preventivo separato. La firma del Cliente attesta la presa visione e accettazione del rischio in caso di mancato adeguamento.</p>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div>Il Cliente per presa visione<br>(firma)</div></div>`,
  },

  {
    code: "VERBALE_MANCATO_ACCESSO",
    title: "Verbale di mancato accesso",
    category: "MANCATO_ACCESSO",
    description: "TUTELA: cliente assente o area non accessibile al momento dell'intervento programmato.",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "EMPLOYEE",
    bodyTemplate: `${baseStyles}
<h1>Verbale di mancato accesso al cantiere</h1>
${header}
<p>Il sottoscritto <strong>{{technician.name}}</strong>, tecnico incaricato per {{tenant.name}}, dichiara:</p>
<p>In data {{dateLong}} alle ore {{time}} si è recato presso:</p>
<div class="box">
<strong>{{customer.companyName}}{{customer.name}} {{customer.surname}}</strong><br>
{{plant.address}}{{customer.address}}<br>
Per intervento programmato: {{workOrder.code}} · {{workOrder.title}}
</div>
<h2>Esito</h2>
<p style="font-size:16px;color:#dc2626;font-weight:bold;">⚠ Accesso negato / Cliente assente</p>
<h2>Motivazione</h2>
<p>{{custom.reason}}</p>
<h2>Tentativi di contatto</h2>
<p>{{custom.contactAttempts}}</p>
<h2>Tempo di attesa</h2>
<p>Il tecnico ha atteso sul posto per {{custom.waitMinutes}} minuti.</p>
<p class="legal">Ai sensi delle condizioni generali di contratto, le ore di trasferta e attesa saranno addebitate al Cliente. La data di intervento sarà riprogrammata previa nuova conferma. Il presente verbale, redatto in autonomia, costituisce prova del mancato accesso.</p>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div></div></div>`,
  },

  {
    code: "VERBALE_RIFIUTO",
    title: "Verbale di rifiuto intervento da parte del Cliente",
    category: "RIFIUTO",
    description: "TUTELA: cliente rifiuta di firmare DICO/rapportino/proposta o di pagare. Documenta per uso legale.",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "EMPLOYEE",
    bodyTemplate: `${baseStyles}
<h1>Verbale di rifiuto / contestazione cliente</h1>
${header}
${parties}
<p>In data {{dateLong}} alle ore {{time}}, presso {{plant.address}}, il sottoscritto <strong>{{technician.name}}</strong>, dipendente/incaricato di {{tenant.name}}, ha rilevato quanto segue:</p>
<h2>Oggetto del rifiuto / contestazione</h2>
<div class="warn">{{custom.subject}}</div>
<h2>Esposizione dei fatti</h2>
<div class="box">{{custom.facts}}</div>
<h2>Documenti / lavori contestati</h2>
<p>{{custom.contested}}</p>
<h2>Motivazione addotta dal Cliente</h2>
<p>{{custom.customerReason}}</p>
<h2>Posizione della Ditta</h2>
<p>{{custom.companyPosition}}</p>
<h2>Testimoni presenti</h2>
<p>{{custom.witnesses}}</p>
<p class="legal">Il presente verbale è redatto in autonomia dal tecnico in qualità di pubblico incaricato di servizio. Costituisce prova ai sensi dell'art. 2700 e ss. cc se sottoscritto dai testimoni. Sarà utilizzato in eventuale sede legale per il recupero del credito e per la difesa della reputazione della ditta.</p>
<div class="sig"><div>Il Tecnico<br>{{technician.name}}</div><div>Testimoni<br>(firma)</div></div>`,
  },

  {
    code: "SAL",
    title: "Stato Avanzamento Lavori (SAL)",
    category: "SAL",
    description: "Pagamento progressivo proporzionale ai lavori eseguiti.",
    requireSignature: true, signerRole: "BOTH", audience: "CUSTOMER",
    bodyTemplate: `${baseStyles}
<h1>Stato Avanzamento Lavori n. {{custom.salNumber}}</h1>
${header}
${parties}
<p>Periodo di riferimento: dal {{custom.fromDate}} al {{custom.toDate}}</p>
<h2>Lavori contabilizzati</h2>
<table>
<tr><th>Descrizione</th><th>UM</th><th>Q.tà</th><th>Prezzo</th><th>Importo</th></tr>
{{custom.salTable}}
</table>
<h2>Riepilogo economico</h2>
<table>
<tr><td>Importo contratto</td><td style="text-align:right;">€ {{custom.contractAmount}}</td></tr>
<tr><td>SAL precedenti</td><td style="text-align:right;">€ {{custom.previousSal}}</td></tr>
<tr><td><strong>SAL corrente</strong></td><td style="text-align:right;font-weight:bold;">€ {{custom.currentSal}}</td></tr>
<tr><td>Residuo a finire</td><td style="text-align:right;">€ {{custom.residual}}</td></tr>
</table>
<p class="legal">Il presente SAL è da intendersi quale stato di avanzamento contabile. La firma del Cliente vale come ricevuta di consegna e abilita la ditta all'emissione della fattura corrispondente con pagamento a {{custom.paymentTerms}}.</p>
<div class="sig"><div>Il Direttore Lavori<br>{{technician.name}}</div><div>Il Cliente per accettazione<br>(firma)</div></div>`,
  },

  {
    code: "GARANZIA_DECENNALE",
    title: "Dichiarazione di garanzia legale (art. 1669 cc)",
    category: "GARANZIA",
    description: "Garanzia decennale per gravi difetti dell'opera elettrica.",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "CUSTOMER",
    legalReference: "Art. 1669 cc",
    bodyTemplate: `${baseStyles}
<h1>Dichiarazione di garanzia legale</h1>
${header}
${parties}
<p>{{tenant.name}}, con sede in {{tenant.address}}, P.IVA {{tenant.vatNumber}}, in relazione all'opera realizzata:</p>
<div class="box">
<strong>{{plant.name}}</strong><br>
{{custom.workDescription}}<br>
Consegna: {{custom.deliveryDate}}
</div>
<h2>Garanzia prestata</h2>
<p>Ai sensi dell'art. 1669 cc (rovina e difetti gravi di cose immobili) e dell'art. 1667 cc (difformità e vizi dell'opera), la scrivente ditta garantisce:</p>
<ul>
<li><strong>10 anni</strong> dalla data di consegna per gravi difetti che incidano sulla stabilità o sicurezza dell'impianto</li>
<li><strong>2 anni</strong> dalla data di consegna per vizi e difformità ordinarie</li>
<li><strong>Conformità DM 37/08</strong> attestata da DICO n. {{custom.dicoNumber}}</li>
</ul>
<h2>Modalità di attivazione</h2>
<p>In caso di difetto coperto da garanzia, il Cliente deve denunciare il vizio entro <strong>60 giorni</strong> dalla scoperta (decadenza ex art. 1669 cc) mediante comunicazione scritta a {{tenant.email}} o PEC {{tenant.pec}}.</p>
<h2>Esclusioni</h2>
<p>{{custom.exclusions}}</p>
<p class="legal">La presente garanzia non sostituisce ma integra la garanzia legale di conformità prevista dal Codice del Consumo (D.Lgs. 206/2005) per i consumatori.</p>
<div class="sig"><div>La Ditta<br>{{tenant.name}}</div><div></div></div>`,
  },

  {
    code: "RELAZIONE_TECNICA",
    title: "Relazione tecnica (allegato DICO)",
    category: "RELAZIONE_TECNICA",
    description: "Relazione con tipologia materiali e dimensionamento per impianti > 6 kW (DM 37/08).",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "BOTH",
    legalReference: "DM 37/08 art. 7",
    bodyTemplate: `${baseStyles}
<h1>Relazione tecnica</h1>
<p style="text-align:center;font-style:italic;">Allegato alla Dichiarazione di Conformità n. {{custom.dicoNumber}}</p>
${header}
${parties}
<h2>Impianto realizzato</h2>
<p><strong>{{plant.name}}</strong> · Tipo: {{plant.type}}</p>
<h2>Dati di progetto</h2>
<table>
<tr><td>Potenza disponibile</td><td>{{custom.power}} kW</td></tr>
<tr><td>Tensione di alimentazione</td><td>{{custom.voltage}} V</td></tr>
<tr><td>Sistema di distribuzione</td><td>{{custom.distribution}}</td></tr>
<tr><td>Corrente di corto circuito presunta</td><td>{{custom.iccPresunta}} kA</td></tr>
</table>
<h2>Tipologia dei materiali installati</h2>
<div class="box">{{custom.materials}}</div>
<h2>Dimensionamento</h2>
<p>{{custom.sizing}}</p>
<h2>Misure di protezione</h2>
<ul>
<li>Contro contatti diretti: {{custom.directContacts}}</li>
<li>Contro contatti indiretti: {{custom.indirectContacts}}</li>
<li>Contro sovracorrenti: {{custom.overcurrent}}</li>
<li>Contro fulminazioni: {{custom.lightning}}</li>
</ul>
<h2>Norme di riferimento</h2>
<p>CEI 64-8, CEI EN 60204-1, CEI 0-21 (FV), {{custom.otherNorms}}</p>
<div class="sig"><div>Il Responsabile Tecnico<br>{{custom.rtName}}<br>Iscr. albo n. {{custom.rtRegNo}}</div><div></div></div>`,
  },

  {
    code: "VERIFICA_DPR462",
    title: "Verbale verifica periodica DPR 462/01",
    category: "VERIFICA_DPR462",
    description: "Verifica messa a terra, scariche atmosferiche, locali a rischio esplosione.",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "BOTH",
    legalReference: "DPR 462/01",
    bodyTemplate: `${baseStyles}
<h1>Verbale di verifica periodica</h1>
<p style="text-align:center;font-style:italic;">Ai sensi del DPR 462/01</p>
${header}
${parties}
<h2>Datore di lavoro</h2>
<p>{{customer.companyName}}{{customer.name}} {{customer.surname}}<br>
P.IVA/C.F.: {{customer.vatNumber}}{{customer.fiscalCode}}</p>
<h2>Luogo di verifica</h2>
<p>{{plant.address}}</p>
<h2>Tipologia verifica (art. 4 DPR 462/01)</h2>
<p>{{custom.verifyType}}</p>
<h2>Impianto di terra</h2>
<table>
<tr><td>Tipo dispersore</td><td>{{custom.earthType}}</td></tr>
<tr><td>R<sub>E</sub> misurata</td><td>{{custom.earthResistance}} Ω</td></tr>
<tr><td>I<sub>n</sub> diff. principale</td><td>{{custom.diffNomCurrent}}</td></tr>
<tr><td>R<sub>E</sub> × I<sub>n</sub></td><td>{{custom.calcRiIn}} V (≤ 50V)</td></tr>
</table>
<h2>Esito</h2>
<p style="font-size:16px;font-weight:bold;color:{{custom.esitoColor}};">{{custom.esito}}</p>
<h2>Prescrizioni</h2>
<p>{{custom.prescriptions}}</p>
<p class="legal">Verbale da conservare a cura del datore di lavoro e da esibire in caso di controlli ASL/INAIL. Prossima verifica entro {{custom.nextVerification}} (biennale/quinquennale).</p>
<div class="sig"><div>Verificatore (CEI EN 61140)<br>{{custom.verifierName}}<br>Tessera n. {{custom.verifierId}}</div><div>Il Datore di lavoro<br>(firma)</div></div>`,
  },

  {
    code: "ATTESTATO_FORMAZIONE",
    title: "Attestato formazione PES/PAV/PEI",
    category: "FORMAZIONE",
    description: "Attestato di formazione per lavori elettrici sotto/in prossimità tensione (CEI 11-27).",
    requireSignature: true, signerRole: "EMPLOYEE", audience: "EMPLOYEE",
    legalReference: "CEI 11-27 / D.Lgs. 81/08",
    bodyTemplate: `${baseStyles}
<h1>Attestato di formazione</h1>
<p style="text-align:center;font-style:italic;">CEI 11-27:2014 · D.Lgs. 81/08 art. 82</p>
${header}
<h2>Si attesta che</h2>
<div class="box" style="text-align:center;font-size:18px;">
<strong>{{custom.workerName}}</strong><br>
nato/a a {{custom.birthPlace}} il {{custom.birthDate}}<br>
C.F.: {{custom.workerCF}}
</div>
<h2>Ha frequentato il corso di formazione per</h2>
<p style="text-align:center;font-size:16px;font-weight:bold;">{{custom.qualification}}</p>
<p>Persona Esperta (PES) / Persona Avvertita (PAV) / Idoneo a lavori sotto tensione (PEI)</p>
<h2>Programma</h2>
<p>{{custom.programDetails}}</p>
<h2>Esito esame finale</h2>
<p>Superato in data {{custom.examDate}}</p>
<h2>Validità</h2>
<p>Validità 5 anni con aggiornamento periodico (CEI 11-27 §5).</p>
<div class="sig"><div>Il Formatore<br>{{custom.trainerName}}</div><div>Il Datore di lavoro<br>{{tenant.name}}</div></div>`,
  },
];
