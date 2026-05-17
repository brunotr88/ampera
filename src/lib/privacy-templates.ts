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
    fiscalCode?: string;
    email?: string;
  };
  dpoEmail?: string;
  consentDate?: Date;
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

export function getPrivacyTemplate(type: string) {
  return PRIVACY_TEMPLATES.find(t => t.type === type);
}
