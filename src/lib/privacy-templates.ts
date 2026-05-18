/**
 * Modelli GDPR conformi Reg. UE 2016/679 e D.Lgs 196/03 e succ. mod.
 * Personalizzati per aziende di impianti elettrici.
 */

export type PrivacyTemplate = {
  type: string;
  title: string;
  description: string;
  audience: "CUSTOMER" | "EMPLOYEE" | "BOTH";
  consentRequired: boolean;
  generateHtml: (opts: PrivacyTemplateOpts) => string;
};

export type PrivacyTemplateOpts = {
  tenant: {
    name: string;
    vatNumber?: string | null;
    fiscalCode?: string | null;
    address?: string | null;
    city?: string | null;
    province?: string | null;
    zip?: string | null;
    email?: string | null;
    phone?: string | null;
    pec?: string | null;
  };
  subject?: {
    name?: string;
    surname?: string;
    fiscalCode?: string;
    vatNumber?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    role?: string;
    companyName?: string;
  };
  dpoEmail?: string;
  consentDate?: Date;
  customFields?: Record<string, string>;
};

function header(t: PrivacyTemplateOpts["tenant"]) {
  return `<header style="border-bottom:3px solid #1D4ED8;padding-bottom:14px;margin-bottom:18px">
    <h1 style="margin:0;color:#1D4ED8;font-size:22px">${t.name}</h1>
    ${t.vatNumber ? `<div style="font-size:11px;color:#6b7280">P.IVA ${t.vatNumber} ${t.fiscalCode ? `· CF ${t.fiscalCode}` : ""}</div>` : ""}
    ${t.address ? `<div style="font-size:11px;color:#6b7280">${[t.address, t.city, t.province, t.zip].filter(Boolean).join(", ")}</div>` : ""}
    ${t.email || t.pec ? `<div style="font-size:11px;color:#6b7280">${[t.email, t.pec ? `PEC: ${t.pec}` : null, t.phone].filter(Boolean).join(" · ")}</div>` : ""}
  </header>`;
}

function styles() {
  return `<style>
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family: -apple-system,Segoe UI,Roboto,sans-serif; font-size: 12px; color: #111; margin: 0; line-height: 1.5; }
    h2 { color: #1D4ED8; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; margin: 16px 0 6px; }
    h3 { font-size: 12px; margin: 10px 0 4px; color: #374151; }
    p { margin: 4px 0; text-align: justify; }
    ul { padding-left: 18px; margin: 4px 0; }
    li { padding: 2px 0; }
    .sig-box { margin-top: 20px; border: 1px dashed #d1d5db; padding: 10px; min-height: 100px; border-radius: 6px; }
    .sig-line { border-bottom: 1px solid #6b7280; margin-top: 30px; padding-bottom: 4px; text-align: center; }
    .consent { background: #f9fafb; border: 1px solid #e5e7eb; padding: 10px; margin: 8px 0; border-radius: 4px; }
    .consent label { display: flex; gap: 8px; align-items: flex-start; }
    .checkbox { display: inline-block; width: 14px; height: 14px; border: 1px solid #9ca3af; margin-top: 2px; }
    .footer { margin-top: 20px; text-align: center; color: #6b7280; font-size: 10px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>`;
}

export const PRIVACY_TEMPLATES: PrivacyTemplate[] = [
  {
    type: "CUSTOMER_INFORMATIVE",
    title: "Informativa Privacy Clienti",
    description: "Informativa ex art. 13 GDPR per il trattamento dati personali clienti. Da consegnare/inviare al primo contatto.",
    audience: "CUSTOMER",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Informativa Privacy Clienti</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px">Informativa sul trattamento dei dati personali</h1>
      <p style="text-align:center;color:#6b7280;font-size:11px">ex art. 13 Reg. UE 2016/679 (GDPR) e D.Lgs 196/03 come modificato dal D.Lgs 101/2018</p>

      <h2>1. Titolare del trattamento</h2>
      <p><strong>${o.tenant.name}</strong> ${o.tenant.vatNumber ? `(P.IVA ${o.tenant.vatNumber})` : ""}, con sede in ${[o.tenant.address, o.tenant.city, o.tenant.province, o.tenant.zip].filter(Boolean).join(", ") || "[indirizzo]"}.</p>
      <p>Contatti: ${o.tenant.email || "[email]"}${o.tenant.pec ? ` · PEC: ${o.tenant.pec}` : ""}${o.tenant.phone ? ` · Tel: ${o.tenant.phone}` : ""}</p>
      ${o.dpoEmail ? `<p>Responsabile della protezione dei dati (DPO): ${o.dpoEmail}</p>` : ""}

      <h2>2. Finalità del trattamento</h2>
      <p>I dati personali raccolti saranno trattati per le seguenti finalità:</p>
      <ul>
        <li><strong>a) Esecuzione del contratto:</strong> stipula contratti, esecuzione lavori di impiantistica elettrica, emissione preventivi e fatture, gestione rapportini di intervento, comunicazioni inerenti i servizi richiesti.</li>
        <li><strong>b) Obblighi di legge:</strong> adempimenti contabili, fiscali, tributari (fatturazione elettronica SDI, conservazione documentale 10 anni), normative DM 37/08 per dichiarazioni di conformità (DICO), DPR 462/01 per verifiche periodiche.</li>
        <li><strong>c) Legittimo interesse:</strong> gestione contenziosi, recupero crediti, miglioramento dei servizi, sicurezza informatica.</li>
        <li><strong>d) Marketing (solo previo consenso):</strong> invio di comunicazioni promozionali su offerte e novità.</li>
      </ul>

      <h2>3. Base giuridica</h2>
      <p>La base giuridica è il contratto (art. 6.1.b GDPR) per la finalità a), l'obbligo di legge (art. 6.1.c GDPR) per la finalità b), il legittimo interesse (art. 6.1.f GDPR) per la finalità c) e il consenso esplicito (art. 6.1.a GDPR) per la finalità d).</p>

      <h2>4. Categorie di dati trattati</h2>
      <ul>
        <li>Dati anagrafici: nome, cognome, codice fiscale, P.IVA, indirizzo, contatti</li>
        <li>Dati di contatto: email, telefono, PEC</li>
        <li>Dati fiscali: ragione sociale, codice destinatario SDI</li>
        <li>Dati tecnici degli impianti: tipologia, ubicazione, fotografie, geolocalizzazione interventi</li>
        <li>Dati bancari per fatturazione (IBAN se rilevante)</li>
      </ul>

      <h2>5. Modalità di trattamento</h2>
      <p>I dati sono trattati con strumenti informatici e cartacei, con misure di sicurezza adeguate a garantire integrità e riservatezza (crittografia AES-256-GCM at-rest per dati sensibili, accessi protetti, backup regolari, audit log). I dati restano sui nostri server (o presso responsabili esterni nominati) ubicati in Italia/UE.</p>

      <h2>6. Conservazione</h2>
      <p>I dati saranno conservati per:</p>
      <ul>
        <li>Dati contrattuali e fatturazione: 10 anni (DPR 600/73, art. 22)</li>
        <li>DICO e documentazione tecnica: 10 anni minimi (DM 37/08)</li>
        <li>Dati per marketing: fino a revoca del consenso (max 24 mesi)</li>
        <li>Comunicazioni email: 5 anni dall'ultimo contatto</li>
      </ul>

      <h2>7. Comunicazione e diffusione</h2>
      <p>I dati potranno essere comunicati a: commercialisti e consulenti fiscali, banche/istituti finanziari per pagamenti, Agenzia delle Entrate (SDI), ENEA (per agevolazioni), INAIL/ASL (per verifiche periodiche), assicurazioni, autorità pubbliche se richiesto. I dati NON saranno diffusi o trasferiti extra-UE senza adeguate garanzie.</p>

      <h2>8. Diritti dell'interessato (artt. 15-22 GDPR)</h2>
      <p>Hai diritto di:</p>
      <ul>
        <li>Accedere ai tuoi dati, ottenerne copia, conoscere finalità e destinatari</li>
        <li>Rettificare dati inesatti, integrare dati incompleti</li>
        <li>Cancellare i dati (diritto all'oblio, salvo obblighi di legge)</li>
        <li>Limitare il trattamento in casi specifici</li>
        <li>Opporti al trattamento per motivi legittimi</li>
        <li>Ricevere i dati in formato strutturato (portabilità)</li>
        <li>Revocare il consenso in qualsiasi momento (senza pregiudicare la liceità del trattamento precedente)</li>
        <li>Proporre reclamo al Garante (www.garanteprivacy.it)</li>
      </ul>
      <p>Per esercitare i diritti, contatta: ${o.tenant.email || "[email]"} ${o.tenant.pec ? `o PEC ${o.tenant.pec}` : ""}.</p>

      <h2>9. Conferimento dei dati</h2>
      <p>Il conferimento dei dati per le finalità a), b) e c) è obbligatorio. Il rifiuto comporta l'impossibilità di erogare i servizi richiesti. Il conferimento per la finalità d) (marketing) è facoltativo.</p>

      <h2>Consensi</h2>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Presto il consenso</strong> al trattamento dei dati per le finalità a), b), c) sopra indicate. <em>(Obbligatorio per l'erogazione dei servizi)</em></span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span>Presto il consenso al trattamento per finalità di marketing diretto (newsletter, offerte). <em>(Facoltativo)</em></span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span>Presto il consenso alla comunicazione dei miei dati a terzi (commercialista, banche, assicurazioni). <em>(Strettamente necessario per servizi)</em></span></label>
      </div>

      <div style="margin-top:30px;display:flex;gap:30px">
        <div style="flex:1">
          <div>Luogo e data:</div>
          <div class="sig-line">_________________________</div>
        </div>
        <div style="flex:1">
          <div>Firma del cliente${o.subject?.name ? ` (${o.subject.name})` : ""}:</div>
          <div class="sig-line">_________________________</div>
        </div>
      </div>

      <div class="footer">Informativa rilasciata in conformità al GDPR · Versione 1.0 · ${(o.consentDate || new Date()).toLocaleDateString("it-IT")}</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "EMPLOYEE_INFORMATIVE",
    title: "Informativa Privacy Dipendenti/Operatori",
    description: "Informativa per dipendenti, collaboratori e operatori che usano l'app aziendale. Include geolocalizzazione, foto, audit.",
    audience: "EMPLOYEE",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Informativa Privacy Dipendenti</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px">Informativa privacy per lavoratori</h1>
      <p style="text-align:center;color:#6b7280;font-size:11px">ex art. 13 Reg. UE 2016/679 (GDPR) + Statuto dei Lavoratori L. 300/70 art. 4</p>

      <h2>1. Titolare del trattamento</h2>
      <p><strong>${o.tenant.name}</strong>, datore di lavoro, con sede in ${[o.tenant.address, o.tenant.city, o.tenant.province].filter(Boolean).join(", ") || "[sede]"}.</p>

      <h2>2. Finalità del trattamento</h2>
      <ul>
        <li><strong>a) Gestione rapporto di lavoro:</strong> stipendi, contributi INPS/INAIL, ferie, permessi, malattia.</li>
        <li><strong>b) Gestione operativa quotidiana:</strong> assegnazione interventi, programmazione lavori, comunicazioni di servizio, rapportini.</li>
        <li><strong>c) Geolocalizzazione tramite app mobile:</strong> tracciamento orario di inizio/fine intervento, posizione cantieri (vedi sezione 5).</li>
        <li><strong>d) Foto e firme digitali:</strong> documentazione interventi con fotografie geo-taggate e firme grafometriche dei clienti.</li>
        <li><strong>e) Sicurezza e audit:</strong> log accessi, registro azioni effettuate sul gestionale (audit-trail), telecamere sede se presenti.</li>
        <li><strong>f) Adempimenti normativi:</strong> obblighi fiscali, contributivi, formazione sicurezza (D.Lgs 81/08), certificazioni PES/PAV/PEI.</li>
      </ul>

      <h2>3. Base giuridica</h2>
      <p>Contratto di lavoro (art. 6.1.b GDPR), obblighi di legge (art. 6.1.c), legittimo interesse del datore di lavoro (art. 6.1.f) e – per geolocalizzazione e foto - <strong>consenso esplicito</strong> dell'interessato (art. 6.1.a GDPR) e accordo sindacale/autorizzazione INL ex art. 4 St. Lav. dove richiesto.</p>

      <h2>4. Categorie di dati trattati</h2>
      <ul>
        <li>Dati anagrafici e di contatto</li>
        <li>Dati retributivi e fiscali (busta paga, ritenute)</li>
        <li>Dati sanitari (assenze per malattia, visite mediche art. 41 D.Lgs 81/08) - <em>categoria particolare</em></li>
        <li>Dati biometrici (firme grafometriche) - <em>categoria particolare</em></li>
        <li>Dati di geolocalizzazione tramite app Ampera (latitude/longitude)</li>
        <li>Log accessi e attività sul gestionale</li>
        <li>Fotografie effettuate in cantiere con dispositivi aziendali o personali per servizio</li>
        <li>Certificazioni professionali (PES/PAV/PEI, formazione 81/08, patenti)</li>
      </ul>

      <h2>5. ⚠ Geolocalizzazione tramite app mobile</h2>
      <p>L'app Ampera installata sui dispositivi (smartphone aziendale o BYOD con consenso) raccoglie le coordinate GPS:</p>
      <ul>
        <li><strong>Solo quando attivo:</strong> all'inizio giornata (timbratura), all'apertura intervento, alla chiusura rapportino, allo scatto di una foto. <strong>NON in background continuativo.</strong></li>
        <li><strong>Finalità:</strong> certificare l'esecuzione dell'intervento sul luogo dichiarato, sicurezza del lavoratore (geolocalizzazione di emergenza), tracciabilità per cliente.</li>
        <li><strong>NON è uno strumento di controllo a distanza</strong> ai sensi dell'art. 4 St. Lav.: il trattamento non avviene in modo continuo né per finalità disciplinari.</li>
        <li>Conservazione: 12 mesi, poi anonimizzazione.</li>
      </ul>

      <h2>6. Audit log</h2>
      <p>Tutte le azioni effettuate sul gestionale (login, creazioni, modifiche, eliminazioni) sono registrate in un log per finalità di sicurezza, tracciabilità documentale e compliance. Il log non è usato per controllo disciplinare individuale ma è disponibile in caso di indagine su anomalie o richieste di autorità.</p>

      <h2>7. Comunicazione dati</h2>
      <p>Dati comunicati a: commercialista/consulente del lavoro, banca per accrediti, INPS, INAIL, Agenzia delle Entrate, Medico Competente, assicurazioni infortuni, autorità (su richiesta).</p>

      <h2>8. Conservazione</h2>
      <ul>
        <li>Dati anagrafici e contrattuali: 10 anni dalla cessazione del rapporto</li>
        <li>Dati retributivi: 10 anni</li>
        <li>Dati biometrici (firme): 5 anni dall'ultimo utilizzo</li>
        <li>Geolocalizzazione: 12 mesi (poi anonimizzata)</li>
        <li>Audit log: 24 mesi</li>
        <li>Foto interventi: stessa durata del rapportino/cliente collegato</li>
      </ul>

      <h2>9. Diritti dell'interessato</h2>
      <p>Hai gli stessi diritti elencati all'art. 8 dell'informativa cliente (accesso, rettifica, cancellazione, limitazione, opposizione, portabilità, reclamo al Garante).</p>

      <h2>10. Conferimento dei dati</h2>
      <p>Il conferimento per le finalità a), b), e), f) è obbligatorio. Il consenso per c) geolocalizzazione e d) foto/firme è <strong>facoltativo</strong>: il diniego non impedisce il rapporto di lavoro ma potrebbe richiedere modalità operative alternative (es. compilazione rapportini cartacei).</p>

      <h2>Consensi specifici</h2>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> alla geolocalizzazione tramite app aziendale per le finalità di tracciamento interventi e sicurezza personale.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> all'acquisizione di fotografie scattate in cantiere con possibili tracce visive della mia persona/voce.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> all'uso della firma grafometrica e del PIN/biometria per autenticazione sui dispositivi aziendali.</span></label>
      </div>

      <div style="margin-top:30px;display:flex;gap:30px">
        <div style="flex:1"><div>Luogo e data:</div><div class="sig-line">_________________________</div></div>
        <div style="flex:1"><div>Firma del lavoratore${o.subject?.name ? ` (${o.subject.name})` : ""}:</div><div class="sig-line">_________________________</div></div>
      </div>

      <div class="footer">Informativa GDPR Lavoratori · Versione 1.0 · ${(o.consentDate || new Date()).toLocaleDateString("it-IT")}</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "CCTV_INFORMATIVE",
    title: "Informativa Videosorveglianza",
    description: "Cartello informativo videosorveglianza per sede aziendale o cantieri. Conforme Provvedimento Garante 2010.",
    audience: "BOTH",
    consentRequired: false,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Videosorveglianza</title>${styles()}</head><body>
      <div style="border:4px solid #1D4ED8;padding:20px;text-align:center">
        <div style="font-size:48px">📹</div>
        <h1 style="color:#1D4ED8;margin:0">AREA VIDEOSORVEGLIATA</h1>
        <p style="margin:10px 0">ai sensi del Reg. UE 679/2016 e Provv. Garante 8/4/2010</p>
        <p><strong>Titolare:</strong> ${o.tenant.name}${o.tenant.vatNumber ? ` (P.IVA ${o.tenant.vatNumber})` : ""}</p>
        <p><strong>Finalità:</strong> Sicurezza patrimonio aziendale e tutela personale (art. 6.1.f GDPR - legittimo interesse)</p>
        <p><strong>Conservazione:</strong> 24-72 ore (estensibile per esigenze investigative)</p>
        <p>Esercita i tuoi diritti scrivendo a: ${o.tenant.email || "[email]"} ${o.tenant.pec ? ` · PEC ${o.tenant.pec}` : ""}</p>
        <p style="font-size:10px;margin-top:14px">Informativa estesa disponibile presso la sede.</p>
      </div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "GEO_TRACKING_CONSENT",
    title: "Consenso Geolocalizzazione Tecnico",
    description: "Modulo specifico per consenso geolocalizzazione del tecnico tramite app mobile aziendale.",
    audience: "EMPLOYEE",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Consenso geolocalizzazione</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px;text-align:center;margin:0 0 20px">Consenso al trattamento dati di geolocalizzazione</h1>
      <p>Il sottoscritto <strong>${o.subject?.name || "[Nome Cognome]"}</strong>${o.subject?.fiscalCode ? ` CF ${o.subject.fiscalCode}` : ""}, dipendente/collaboratore di <strong>${o.tenant.name}</strong>,</p>
      <p>preso atto della Informativa Privacy Lavoratori già consegnata e dei contenuti dell'art. 4 St. Lav. e del Provv. Garante 24/03/2011 sul controllo a distanza,</p>

      <h2>Dichiara</h2>
      <ul>
        <li>di essere stato informato che l'app Ampera installata sul dispositivo mobile registra coordinate GPS in momenti puntuali (inizio giornata, apertura/chiusura interventi, scatto foto);</li>
        <li>che il dato di geolocalizzazione viene utilizzato esclusivamente per: certificare luogo dell'intervento, sicurezza personale (es. lavoratore solo in luoghi isolati), tracciabilità documentale verso il cliente;</li>
        <li>che il dato NON è raccolto in modalità continua e NON è usato per finalità disciplinari;</li>
        <li>di poter <strong>disattivare la geolocalizzazione</strong> in qualsiasi momento dalle impostazioni del telefono, fermo restando la necessità di documentare diversamente gli interventi;</li>
        <li>di poter revocare il presente consenso in ogni momento con comunicazione scritta al datore di lavoro.</li>
      </ul>

      <div class="consent" style="background:#dcfce7;border-color:#16a34a">
        <label><span class="checkbox"></span><span><strong>PRESTO IL CONSENSO</strong> al trattamento dei dati di geolocalizzazione tramite app Ampera per le finalità sopra descritte.</span></label>
      </div>

      <div style="margin-top:40px;display:flex;gap:30px">
        <div style="flex:1"><div>Luogo e data:</div><div class="sig-line">_________________________</div></div>
        <div style="flex:1"><div>Firma del lavoratore:</div><div class="sig-line">_________________________</div></div>
      </div>

      <div class="footer">Da conservare in fascicolo personale ex art. 4 St. Lav. · Versione 1.0</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "MARKETING_CONSENT",
    title: "Consenso Marketing",
    description: "Modulo specifico consenso comunicazioni commerciali, newsletter, profilazione.",
    audience: "CUSTOMER",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Consenso Marketing</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:16px">Consenso al trattamento per finalità di marketing</h1>
      <p>Il sottoscritto <strong>${o.subject?.name || "[Nome]"}</strong>${o.subject?.fiscalCode ? ` CF ${o.subject.fiscalCode}` : ""}, acquisita preventivamente l'informativa ex art. 13 GDPR,</p>

      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> a ricevere comunicazioni commerciali (email, SMS, WhatsApp) su nuovi servizi, offerte, eventi.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> alla profilazione (analisi delle preferenze) per ricevere comunicazioni personalizzate.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>Acconsento</strong> alla comunicazione dei dati a partner commerciali selezionati per ricevere offerte loro.</span></label>
      </div>

      <p style="font-size:11px;color:#6b7280;margin-top:14px">Puoi revocare ciascun consenso in qualsiasi momento scrivendo a ${o.tenant.email}.</p>

      <div style="margin-top:30px;display:flex;gap:30px">
        <div style="flex:1"><div>Luogo e data:</div><div class="sig-line">_________________________</div></div>
        <div style="flex:1"><div>Firma:</div><div class="sig-line">_________________________</div></div>
      </div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
];

// =====================================================================
// ADDITIONAL TEMPLATES - aggiunti per copertura compliance completa
// =====================================================================

const additionalTemplates: PrivacyTemplate[] = [
  {
    type: "CUSTOMER_CONSENT",
    title: "Consenso Trattamento Dati Cliente",
    description: "Modulo consenso esplicito per finalità contrattuali e operative (separato dall'informativa).",
    audience: "CUSTOMER",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Consenso Cliente</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:16px">Consenso al trattamento dei dati personali</h1>
      <p>Il sottoscritto <strong>${o.subject?.companyName || `${o.subject?.name || "[Nome]"} ${o.subject?.surname || ""}`}</strong>${o.subject?.fiscalCode ? ` - CF ${o.subject.fiscalCode}` : ""}${o.subject?.vatNumber ? ` - P.IVA ${o.subject.vatNumber}` : ""}, acquisita preventivamente l'informativa ex art. 13 GDPR del titolare ${o.tenant.name},</p>
      <h2>Dichiara di prestare il proprio consenso a:</h2>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>a) Finalita contrattuali</strong> (obbligatorio): trattamento dati per esecuzione contratto, fatturazione, comunicazioni di servizio, gestione interventi e impianti.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>b) Obblighi di legge</strong> (obbligatorio): adempimenti fiscali, fatturazione elettronica SDI, conservazione documentale 10 anni, normative DM 37/08 e DPR 462/01.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>c) Marketing diretto</strong> (facoltativo): comunicazioni commerciali, offerte, newsletter via email/SMS/WhatsApp.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>d) Profilazione</strong> (facoltativo): analisi preferenze e comportamenti per personalizzare offerte.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>e) Comunicazione a terzi commerciali</strong> (facoltativo): condivisione con partner per offerte loro.</span></label>
      </div>
      <p style="font-size:11px;color:#6b7280;margin-top:14px">Il consenso e revocabile in ogni momento contattando ${o.tenant.email || "[email]"} o PEC ${o.tenant.pec || "[pec]"}.</p>
      <div style="margin-top:30px;display:flex;gap:30px">
        <div style="flex:1"><div>Luogo, ${o.tenant.city || "—"} · Data ____________</div></div>
        <div style="flex:1"><div>Firma:</div><div class="sig-line">${o.subject?.companyName || `${o.subject?.name || ""} ${o.subject?.surname || ""}`.trim() || "_______________________"}</div></div>
      </div>
      <div class="footer">Consenso GDPR art. 6.1.a · v1.0</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "EMPLOYEE_CONSENT",
    title: "Consenso Dipendente/Operatore",
    description: "Consenso esplicito a geolocalizzazione, foto, firma grafometrica, biometria su app aziendale.",
    audience: "EMPLOYEE",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Consenso Operatore</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:16px">Consenso al trattamento dati - Operatore / Dipendente</h1>
      <p>Il sottoscritto <strong>${o.subject?.name || ""} ${o.subject?.surname || ""}</strong>${o.subject?.fiscalCode ? ` - CF ${o.subject.fiscalCode}` : ""}${o.subject?.role ? `, in qualita di ${o.subject.role}` : ""}, dipendente / collaboratore di <strong>${o.tenant.name}</strong>, acquisita l'informativa privacy lavoratori,</p>

      <h2>Presta consenso esplicito al trattamento dei seguenti dati:</h2>

      <div class="consent">
        <label><span class="checkbox"></span><span><strong>1. Geolocalizzazione</strong> tramite app Ampera (coordinate GPS al check-in giornata, apertura/chiusura interventi, scatto foto). Finalita: certificare presenza in cantiere, sicurezza personale, tracciabilita verso cliente. Conservazione 12 mesi. NON usato per controllo a distanza disciplinare.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>2. Fotografie</strong> scattate in cantiere con dispositivi aziendali per documentazione interventi. Possibili tracce visive della persona.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>3. Firma grafometrica</strong> e biometria (Face ID/impronta) per autenticazione su dispositivi aziendali.</span></label>
      </div>
      <div class="consent">
        <label><span class="checkbox"></span><span><strong>4. Dati telematici</strong> e log accessi sul gestionale Ampera per finalita di sicurezza e audit.</span></label>
      </div>

      <p style="font-size:11px;color:#6b7280;margin-top:14px">Conforme art. 4 Statuto Lavoratori L. 300/70 e Provv. Garante 24/03/2011. Revocabile in ogni momento con comunicazione scritta al datore di lavoro.</p>

      <div style="margin-top:30px;display:flex;gap:30px">
        <div style="flex:1"><div>Data: ____________</div></div>
        <div style="flex:1"><div>Firma del lavoratore:</div><div class="sig-line">${o.subject?.name || ""} ${o.subject?.surname || ""}</div></div>
      </div>
      <div class="footer">Consenso Lavoratore · v1.0</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "CONTRACTOR_NDA",
    title: "NDA Fornitori",
    description: "Accordo di riservatezza per fornitori e collaboratori esterni con accesso a dati riservati clienti.",
    audience: "BOTH",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>NDA Fornitore</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px;text-align:center">Accordo di Riservatezza (NDA)</h1>
      <p>Tra <strong>${o.tenant.name}</strong>${o.tenant.vatNumber ? ` (P.IVA ${o.tenant.vatNumber})` : ""} <strong>(Divulgatore)</strong></p>
      <p>e <strong>${o.subject?.companyName || `${o.subject?.name || ""} ${o.subject?.surname || ""}`}</strong>${o.subject?.vatNumber ? ` (P.IVA ${o.subject.vatNumber})` : ""}${o.subject?.fiscalCode ? ` - CF ${o.subject.fiscalCode}` : ""} <strong>(Ricevente)</strong>.</p>

      <h2>1. Oggetto</h2>
      <p>Il Ricevente, nell'esecuzione di prestazioni / fornitura beni in favore del Divulgatore, potra venire a conoscenza di informazioni riservate concernenti: anagrafiche clienti, dati impianti, progetti tecnici, listini prezzi, processi aziendali, know-how, accesso a sistemi informativi.</p>

      <h2>2. Obbligo di riservatezza</h2>
      <p>Il Ricevente si impegna a: (a) non divulgare a terzi alcuna informazione riservata; (b) usarla esclusivamente per l'esecuzione del rapporto; (c) adottare misure di sicurezza adeguate a protezione; (d) imporre lo stesso obbligo ai propri dipendenti/collaboratori.</p>

      <h2>3. Durata</h2>
      <p>Il presente accordo ha durata di <strong>5 anni</strong> dalla data di sottoscrizione e sopravvive alla cessazione del rapporto contrattuale.</p>

      <h2>4. Sanzioni</h2>
      <p>In caso di violazione, il Ricevente sara tenuto al risarcimento integrale del danno subito dal Divulgatore, oltre a eventuali penali contrattuali.</p>

      <h2>5. GDPR</h2>
      <p>Se il Ricevente tratta dati personali per conto del Divulgatore, sara designato <strong>Responsabile del trattamento ex art. 28 GDPR</strong> mediante atto separato (DPA).</p>

      <h2>6. Foro competente</h2>
      <p>Per ogni controversia e competente in via esclusiva il Foro di <strong>Treviso</strong>.</p>

      <div style="margin-top:40px;display:flex;gap:30px">
        <div style="flex:1"><strong>Divulgatore</strong><br>${o.tenant.name}<br><div class="sig-line">_______________________</div></div>
        <div style="flex:1"><strong>Ricevente</strong><br>${o.subject?.companyName || `${o.subject?.name || ""} ${o.subject?.surname || ""}`}<br><div class="sig-line">_______________________</div></div>
      </div>
      <p style="margin-top:14px;font-size:10px">Luogo: ${o.tenant.city || "—"} · Data: ${(o.consentDate || new Date()).toLocaleDateString("it-IT")}</p>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "DATA_PROCESSING_AGREEMENT",
    title: "DPA - Nomina Responsabile del Trattamento",
    description: "Accordo ex art. 28 GDPR per fornitori che trattano dati personali per conto del titolare.",
    audience: "BOTH",
    consentRequired: true,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>DPA art. 28 GDPR</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px;text-align:center">Atto di Nomina del Responsabile del Trattamento</h1>
      <p style="text-align:center;color:#6b7280;font-size:11px">ex art. 28 Reg. UE 2016/679 (GDPR)</p>

      <p><strong>Titolare del trattamento:</strong> ${o.tenant.name}${o.tenant.vatNumber ? ` (P.IVA ${o.tenant.vatNumber})` : ""}, in seguito "Titolare".</p>
      <p><strong>Responsabile esterno designato:</strong> <strong>${o.subject?.companyName || `${o.subject?.name || ""} ${o.subject?.surname || ""}`}</strong>${o.subject?.vatNumber ? ` (P.IVA ${o.subject.vatNumber})` : ""}, in seguito "Responsabile".</p>

      <h2>1. Oggetto e finalità</h2>
      <p>Il Titolare nomina il Responsabile per il trattamento di dati personali necessario all'esecuzione di prestazioni (es. servizi tecnici, hosting, consulenza fiscale, manutenzione software).</p>

      <h2>2. Categorie di dati e di interessati</h2>
      <ul>
        <li>Categorie di interessati: clienti, dipendenti, fornitori del Titolare.</li>
        <li>Categorie di dati: anagrafici, di contatto, fiscali, tecnici impianti, fotografie, eventuali dati biometrici (firme).</li>
        <li>Eventuali dati particolari (categorie speciali art. 9 GDPR): solo se strettamente necessario e con specifica autorizzazione.</li>
      </ul>

      <h2>3. Obblighi del Responsabile</h2>
      <ul>
        <li>Trattare i dati solo per le finalità definite dal Titolare</li>
        <li>Garantire la riservatezza dei propri dipendenti incaricati</li>
        <li>Adottare misure di sicurezza tecniche e organizzative adeguate (art. 32 GDPR): crittografia, autenticazione, log accessi, backup, gestione incidenti</li>
        <li>Notificare al Titolare ogni violazione dei dati (data breach) entro 24 ore</li>
        <li>Assistere il Titolare nel rispondere alle richieste degli interessati (artt. 15-22 GDPR)</li>
        <li>Cooperare con l'Autorità Garante</li>
        <li>Cancellare o restituire i dati al termine del rapporto, distruggendo le copie</li>
        <li>NON ricorrere a sub-responsabili senza autorizzazione scritta del Titolare</li>
        <li>NON trasferire dati extra-UE senza adeguate garanzie</li>
      </ul>

      <h2>4. Sub-responsabili autorizzati</h2>
      <p>Il Titolare autorizza in via generale il Responsabile a ricorrere a sub-responsabili, fermo restando l'obbligo di darne informazione preventiva e di stipulare con essi accordi di pari tenore.</p>

      <h2>5. Audit e ispezioni</h2>
      <p>Il Titolare ha diritto di effettuare audit (anche tramite terzi) per verificare la conformita, con preavviso di 15 giorni.</p>

      <h2>6. Durata e cessazione</h2>
      <p>Il presente atto ha la stessa durata del contratto principale. In caso di cessazione, il Responsabile restituisce o cancella tutti i dati entro 30 giorni e fornisce attestazione scritta.</p>

      <h2>7. Responsabilità</h2>
      <p>Il Responsabile e direttamente responsabile per i danni causati dal trattamento se ha agito in modo difforme o contrario alle istruzioni del Titolare (art. 82 GDPR).</p>

      <div style="margin-top:40px;display:flex;gap:30px">
        <div style="flex:1"><strong>Titolare</strong><br>${o.tenant.name}<br><div class="sig-line">_______________________</div></div>
        <div style="flex:1"><strong>Responsabile</strong><br>${o.subject?.companyName || `${o.subject?.name || ""} ${o.subject?.surname || ""}`}<br><div class="sig-line">_______________________</div></div>
      </div>
      <p style="margin-top:14px;font-size:10px">Data: ${(o.consentDate || new Date()).toLocaleDateString("it-IT")}</p>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
  {
    type: "COOKIE_BANNER",
    title: "Cookie Policy",
    description: "Informativa estesa cookie e Privacy Policy per il sito web aziendale.",
    audience: "CUSTOMER",
    consentRequired: false,
    generateHtml: (o) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Cookie Policy</title>${styles()}</head><body>
      ${header(o.tenant)}
      <h1 style="font-size:18px">Cookie Policy</h1>
      <p>Il sito ${o.tenant.email ? `(www.${(o.tenant.email.split("@")[1] || "azienda.it")})` : ""} utilizza cookie e tecnologie similari per migliorare l'esperienza utente. Ai sensi del Provv. Garante 10/06/2021, la presente informativa specifica i cookie utilizzati.</p>

      <h2>Tipologie di cookie</h2>
      <h3>Cookie tecnici (sempre attivi - non richiedono consenso)</h3>
      <ul>
        <li><strong>Sessione di autenticazione:</strong> mantengono l'utente loggato</li>
        <li><strong>Preferenze tema:</strong> ricordano dark/light mode</li>
        <li><strong>CSRF:</strong> protezione da attacchi cross-site</li>
      </ul>

      <h3>Cookie analitici (richiedono consenso)</h3>
      <ul>
        <li><strong>Google Analytics 4</strong> (anonimizzato): misurazione traffico aggregato. Durata 14 mesi.</li>
        <li><strong>Hotjar / Microsoft Clarity:</strong> mappe di calore per UX (NO se non attivati).</li>
      </ul>

      <h3>Cookie di marketing (richiedono consenso)</h3>
      <ul>
        <li><strong>Meta Pixel:</strong> targeting remarketing Facebook/Instagram (NO se non attivato)</li>
        <li><strong>Google Ads:</strong> conversion tracking (NO se non attivato)</li>
      </ul>

      <h2>Come gestire i cookie</h2>
      <p>Il banner cookie permette di accettare/rifiutare per categoria. Puoi modificare il consenso in ogni momento dalle impostazioni del sito o cancellando i cookie del browser.</p>

      <h2>Titolare del trattamento</h2>
      <p><strong>${o.tenant.name}</strong>${o.tenant.vatNumber ? ` - P.IVA ${o.tenant.vatNumber}` : ""}<br>${[o.tenant.address, o.tenant.city, o.tenant.province, o.tenant.zip].filter(Boolean).join(", ")}<br>Email: ${o.tenant.email || "—"} ${o.tenant.pec ? `· PEC: ${o.tenant.pec}` : ""}</p>

      <h2>Diritti dell'interessato</h2>
      <p>Per esercitare i diritti previsti dagli artt. 15-22 GDPR (accesso, rettifica, cancellazione, opposizione, portabilita) scrivi a ${o.tenant.email || "[email]"} o invia PEC a ${o.tenant.pec || "[pec]"}. Hai diritto di proporre reclamo al Garante (www.garanteprivacy.it).</p>

      <div class="footer">Cookie Policy v1.0 · Aggiornata ${(o.consentDate || new Date()).toLocaleDateString("it-IT")}</div>
      <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
    </body></html>`,
  },
];

PRIVACY_TEMPLATES.push(...additionalTemplates);

export function getPrivacyTemplate(type: string) {
  return PRIVACY_TEMPLATES.find(t => t.type === type);
}
