/**
 * Server-side PDF generation using a minimal HTML-to-PDF approach.
 * Uses no native deps: produces a clean HTML document with print CSS.
 * For deterministic PDF, paired with browser print or headless render.
 * Here we generate self-contained HTML the client prints as PDF.
 */
import { formatCurrency, formatDate, formatDateTime } from "./utils";

export function reportHtml(opts: {
  tenant: any;
  report: any;
  customer: any;
  plant?: any | null;
  site?: any | null;
  technician: any;
  timeEntries: any[];
  materials: any[];
  photos: any[];
}): string {
  const r = opts.report;
  const totalLabor = opts.timeEntries.reduce((s, t) => s + (t.amount || (t.hours * (t.hourlyRate || 0))), 0);
  const totalMat = opts.materials.reduce((s, m) => s + (m.total || m.quantity * m.unitPrice), 0);
  const total = totalLabor + totalMat;
  return `<!doctype html><html lang="it"><head>
  <meta charset="utf-8">
  <title>Rapportino ${r.code}</title>
  <style>
    * { box-sizing: border-box; }
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family: -apple-system,Segoe UI,Roboto,sans-serif; font-size: 12px; color: #111; margin: 0; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 16px; }
    .brand h1 { margin: 0; color: #1D4ED8; font-size: 24px; }
    .brand p { margin: 2px 0; color: #6b7280; font-size: 11px; }
    .meta { text-align: right; font-size: 11px; color: #374151; }
    .meta strong { font-size: 14px; color: #111; }
    h2 { color: #1D4ED8; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; margin: 18px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
    .row { display: flex; justify-content: space-between; padding: 3px 0; }
    .row .label { color: #6b7280; }
    .row .val { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 11px; }
    th { background: #1D4ED8; color: white; padding: 6px 8px; text-align: left; font-weight: 600; }
    td { padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    .totals { margin-top: 10px; }
    .totals .row { font-size: 12px; }
    .totals .grand { border-top: 2px solid #1D4ED8; padding-top: 6px; margin-top: 6px; font-size: 14px; color: #1D4ED8; font-weight: 700; }
    .desc { white-space: pre-wrap; }
    .signature { margin-top: 22px; display: flex; justify-content: space-between; gap: 30px; }
    .sig-box { flex: 1; border: 1px dashed #d1d5db; border-radius: 6px; padding: 10px; min-height: 110px; }
    .sig-box img { max-width: 100%; max-height: 80px; }
    .photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 6px; }
    .photos .ph { border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; text-align: center; }
    .photos img { max-width: 100%; height: 110px; object-fit: cover; border-radius: 3px; }
    .photos .ph-label { font-size: 10px; color: #6b7280; margin-top: 3px; }
    .footer { margin-top: 25px; text-align: center; color: #6b7280; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head><body>
  <div class="header">
    <div class="brand">
      <h1>${escapeHtml(opts.tenant.name)}</h1>
      ${opts.tenant.vatNumber ? `<p>P.IVA ${escapeHtml(opts.tenant.vatNumber)}</p>` : ""}
      ${opts.tenant.address ? `<p>${escapeHtml([opts.tenant.address, opts.tenant.city, opts.tenant.province].filter(Boolean).join(", "))}</p>` : ""}
      ${opts.tenant.phone ? `<p>Tel ${escapeHtml(opts.tenant.phone)} ${opts.tenant.email ? `· ${escapeHtml(opts.tenant.email)}` : ""}</p>` : ""}
    </div>
    <div class="meta">
      <strong>RAPPORTINO ${escapeHtml(r.code)}</strong><br>
      Data: ${formatDate(r.signedAt || r.endedAt || r.startedAt || r.createdAt)}<br>
      Stato: ${escapeHtml(r.status)}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h2 style="margin-top:0">Cliente</h2>
      <div><strong>${escapeHtml(opts.customer.companyName || `${opts.customer.name} ${opts.customer.surname || ""}`.trim())}</strong></div>
      ${opts.customer.vatNumber ? `<div>P.IVA ${escapeHtml(opts.customer.vatNumber)}</div>` : ""}
      ${opts.customer.fiscalCode ? `<div>CF ${escapeHtml(opts.customer.fiscalCode)}</div>` : ""}
      ${opts.customer.email ? `<div>${escapeHtml(opts.customer.email)}</div>` : ""}
      ${opts.customer.phone ? `<div>${escapeHtml(opts.customer.phone)}</div>` : ""}
    </div>
    <div class="card">
      <h2 style="margin-top:0">Intervento</h2>
      ${opts.site ? `<div><strong>${escapeHtml(opts.site.name)}</strong><br>${escapeHtml([opts.site.street, opts.site.city, opts.site.province].filter(Boolean).join(", "))}</div>` : ""}
      ${opts.plant ? `<div style="margin-top:4px"><strong>Impianto:</strong> ${escapeHtml(opts.plant.name)} (${escapeHtml(opts.plant.type)})</div>` : ""}
      ${r.contactPerson ? `<div><strong>Referente:</strong> ${escapeHtml(r.contactPerson)}</div>` : ""}
      <div><strong>Tecnico:</strong> ${escapeHtml(opts.technician.name)}</div>
      <div><strong>Inizio:</strong> ${formatDateTime(r.startedAt)}</div>
      <div><strong>Fine:</strong> ${formatDateTime(r.endedAt)}</div>
    </div>
  </div>

  <h2>Lavoro svolto</h2>
  <div class="card">
    ${r.workType ? `<div><strong>Tipo:</strong> ${escapeHtml(r.workType)}</div>` : ""}
    ${r.cause ? `<div><strong>Causa:</strong> ${escapeHtml(r.cause)}</div>` : ""}
    <div class="desc" style="margin-top:6px">${escapeHtml(r.description || "—")}</div>
    ${r.recommendations ? `<div style="margin-top:8px"><strong>Raccomandazioni cliente:</strong><br><div class="desc">${escapeHtml(r.recommendations)}</div></div>` : ""}
  </div>

  ${opts.timeEntries.length > 0 ? `
    <h2>Ore lavorate</h2>
    <table>
      <thead><tr><th>Tecnico</th><th style="text-align:right">Ore</th><th style="text-align:right">€/h</th><th style="text-align:right">Importo</th></tr></thead>
      <tbody>
        ${opts.timeEntries.map(t => `<tr>
          <td>${escapeHtml(t.user?.name || "—")}</td>
          <td style="text-align:right">${t.hours.toFixed(2)}</td>
          <td style="text-align:right">${formatCurrency(t.hourlyRate || 0)}</td>
          <td style="text-align:right">${formatCurrency(t.amount || (t.hours * (t.hourlyRate || 0)))}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}

  ${opts.materials.length > 0 ? `
    <h2>Materiali utilizzati</h2>
    <table>
      <thead><tr><th>Codice</th><th>Descrizione</th><th style="text-align:right">Qta</th><th>UM</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead>
      <tbody>
        ${opts.materials.map(m => `<tr>
          <td>${escapeHtml(m.code || m.material?.code || "—")}</td>
          <td>${escapeHtml(m.description)}</td>
          <td style="text-align:right">${m.quantity}</td>
          <td>${escapeHtml(m.unit)}</td>
          <td style="text-align:right">${formatCurrency(m.unitPrice)}</td>
          <td style="text-align:right">${formatCurrency(m.total || (m.quantity * m.unitPrice))}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : ""}

  ${opts.photos.length > 0 ? `
    <h2>Foto cantiere</h2>
    <div class="photos">
      ${opts.photos.map(p => `<div class="ph"><img src="${escapeHtml(p.url)}" alt=""><div class="ph-label">${escapeHtml(p.label || "Foto")}</div></div>`).join("")}
    </div>` : ""}

  <div class="totals">
    <h2>Totali</h2>
    <div class="row"><span>Manodopera</span><span>${formatCurrency(totalLabor)}</span></div>
    <div class="row"><span>Materiali</span><span>${formatCurrency(totalMat)}</span></div>
    <div class="row grand"><span>TOTALE (escl. IVA)</span><span>${formatCurrency(total)}</span></div>
  </div>

  <div class="signature">
    <div class="sig-box">
      <strong>Firma cliente</strong>
      ${r.signatureDataUrl ? `<div style="margin-top:8px"><img src="${escapeHtml(r.signatureDataUrl)}" alt="firma"></div>` : `<div style="color:#9ca3af;margin-top:30px;text-align:center">— da firmare —</div>`}
      <div style="margin-top:8px;color:#6b7280">${escapeHtml(r.signerName || "")} ${r.signedAt ? `· ${formatDateTime(r.signedAt)}` : ""}</div>
    </div>
    <div class="sig-box">
      <strong>Firma tecnico</strong>
      <div style="margin-top:30px;text-align:center;color:#6b7280">${escapeHtml(opts.technician.name)}</div>
    </div>
  </div>

  <div class="footer">
    Documento generato da Ampera · ${formatDateTime(new Date())} · Rapportino #${escapeHtml(r.code)}
  </div>
  <script>setTimeout(()=>{if(window.location.search.includes('print=1'))window.print()},300)</script>
</body></html>`;
}

export function quoteHtml(opts: { tenant: any; quote: any; customer: any; lines: any[] }): string {
  const q = opts.quote;
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Preventivo ${q.number}/${q.version}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family: -apple-system,Segoe UI,sans-serif; font-size: 12px; margin: 0; color:#111; }
    .header { border-bottom: 3px solid #1D4ED8; padding-bottom:10px; margin-bottom: 18px; display:flex; justify-content:space-between; align-items:flex-start; }
    .brand h1 { color:#1D4ED8; margin:0; font-size:22px; }
    .meta { text-align:right; }
    .meta .num { font-size:18px; font-weight:700; color:#1D4ED8; }
    h2 { color:#1D4ED8; font-size:13px; text-transform:uppercase; border-bottom:1px solid #e5e7eb; padding-bottom:4px; margin-top:18px; }
    .card { background:#f9fafb; border:1px solid #e5e7eb; padding:10px; border-radius:6px; }
    table { width:100%; border-collapse: collapse; margin-top:6px; font-size:11px; }
    th { background:#1D4ED8; color:white; padding:6px; text-align:left; }
    td { padding:5px 6px; border-bottom: 1px solid #e5e7eb; }
    .num { text-align:right; }
    .totals { margin-top:14px; margin-left:auto; width: 280px; }
    .totals .row { display:flex; justify-content:space-between; padding:3px 0; }
    .totals .grand { font-size:16px; color:#1D4ED8; font-weight:700; border-top:2px solid #1D4ED8; padding-top:6px; margin-top:6px;}
  </style></head><body>
  <div class="header">
    <div class="brand"><h1>${escapeHtml(opts.tenant.name)}</h1>
      ${opts.tenant.vatNumber ? `<div style="color:#6b7280;font-size:11px">P.IVA ${escapeHtml(opts.tenant.vatNumber)}</div>` : ""}
    </div>
    <div class="meta"><div class="num">Preventivo ${escapeHtml(q.number)} v${q.version}</div>
      <div style="color:#6b7280">Data: ${formatDate(q.createdAt)}</div>
      ${q.validUntil ? `<div style="color:#6b7280">Valido fino al: ${formatDate(q.validUntil)}</div>` : ""}
    </div>
  </div>

  <div class="card">
    <strong>Cliente:</strong> ${escapeHtml(opts.customer.companyName || `${opts.customer.name} ${opts.customer.surname || ""}`)}
    ${opts.customer.vatNumber ? `<br>P.IVA ${escapeHtml(opts.customer.vatNumber)}` : ""}
  </div>

  <h2>${escapeHtml(q.title)}</h2>
  ${q.description ? `<div style="white-space:pre-wrap;margin-bottom:10px">${escapeHtml(q.description)}</div>` : ""}

  <table>
    <thead><tr><th>#</th><th>Descrizione</th><th class="num">Q.tà</th><th>UM</th><th class="num">Prezzo</th><th class="num">Sc.%</th><th class="num">IVA</th><th class="num">Totale</th></tr></thead>
    <tbody>
      ${opts.lines.map((l, i) => `<tr>
        <td>${i+1}</td>
        <td>${escapeHtml(l.description)}${l.code ? `<br><small style="color:#9ca3af">${escapeHtml(l.code)}</small>` : ""}</td>
        <td class="num">${l.quantity}</td>
        <td>${escapeHtml(l.unit)}</td>
        <td class="num">${formatCurrency(l.unitPrice)}</td>
        <td class="num">${l.discountPercent}%</td>
        <td class="num">${l.vatRate}%</td>
        <td class="num">${formatCurrency(l.total)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Imponibile</span><span>${formatCurrency(q.subtotal)}</span></div>
    <div class="row"><span>IVA</span><span>${formatCurrency(q.vatTotal)}</span></div>
    <div class="row grand"><span>TOTALE</span><span>${formatCurrency(q.total)}</span></div>
  </div>

  ${q.terms ? `<h2>Condizioni</h2><div style="white-space:pre-wrap">${escapeHtml(q.terms)}</div>` : ""}
  <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
</body></html>`;
}

export function invoiceHtml(opts: { tenant: any; invoice: any; customer: any; lines: any[] }): string {
  const inv = opts.invoice;
  const docTypeLabel: Record<string, string> = {
    INVOICE: "FATTURA", CREDIT_NOTE: "NOTA DI CREDITO", PROFORMA: "FATTURA PROFORMA",
    TD24_DEFERRED: "FATTURA DIFFERITA (TD24)", TD20_SELF: "AUTOFATTURA (TD20)",
  };
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${docTypeLabel[inv.type]} ${inv.number}</title>
  <style>
    @page { size: A4; margin: 18mm 14mm; }
    body { font-family:-apple-system,sans-serif; font-size:12px; color:#111; margin:0; }
    .header { border-bottom: 3px solid #1D4ED8; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; }
    h1 { color: #1D4ED8; margin: 0; font-size: 22px; }
    .label { color:#6b7280; font-size:11px; text-transform:uppercase; }
    table { width:100%; border-collapse:collapse; margin-top:6px; font-size:11px; }
    th { background:#1D4ED8; color:white; padding:6px; text-align:left; }
    td { padding:5px 6px; border-bottom:1px solid #e5e7eb; }
    .num { text-align:right; }
    .totals { margin-top:14px; margin-left:auto; width: 280px; }
    .totals .row { display:flex; justify-content:space-between; padding:3px 0; }
    .totals .grand { font-size:16px; color:#1D4ED8; font-weight:700; border-top:2px solid #1D4ED8; padding-top:6px; }
    .footer { margin-top:30px; padding-top:10px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:10px; text-align:center; }
  </style></head><body>
  <div class="header">
    <div>
      <h1>${escapeHtml(opts.tenant.name)}</h1>
      <div class="label">P.IVA ${escapeHtml(opts.tenant.vatNumber || "—")}</div>
      ${opts.tenant.address ? `<div>${escapeHtml(opts.tenant.address)}, ${escapeHtml(opts.tenant.city || "")}</div>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-size:18px;font-weight:700;color:#1D4ED8">${docTypeLabel[inv.type]}</div>
      <div>N. <strong>${escapeHtml(inv.number)}${inv.series ? `/${escapeHtml(inv.series)}` : ""}</strong></div>
      <div>Data: ${formatDate(inv.issueDate)}</div>
      ${inv.dueDate ? `<div>Scadenza: ${formatDate(inv.dueDate)}</div>` : ""}
    </div>
  </div>

  <div style="background:#f9fafb;border:1px solid #e5e7eb;padding:10px;border-radius:6px;margin-bottom:14px">
    <div class="label">Destinatario</div>
    <div style="font-weight:600;font-size:14px">${escapeHtml(opts.customer.companyName || `${opts.customer.name} ${opts.customer.surname || ""}`)}</div>
    ${opts.customer.vatNumber ? `<div>P.IVA ${escapeHtml(opts.customer.vatNumber)}</div>` : ""}
    ${opts.customer.fiscalCode ? `<div>CF ${escapeHtml(opts.customer.fiscalCode)}</div>` : ""}
    ${opts.customer.sdiCode ? `<div>Codice SDI: ${escapeHtml(opts.customer.sdiCode)}</div>` : ""}
    ${opts.customer.pec ? `<div>PEC: ${escapeHtml(opts.customer.pec)}</div>` : ""}
  </div>

  <table>
    <thead><tr><th>#</th><th>Descrizione</th><th class="num">Q.tà</th><th>UM</th><th class="num">Prezzo</th><th class="num">Sc.%</th><th class="num">IVA</th><th class="num">Importo</th></tr></thead>
    <tbody>
      ${opts.lines.map((l, i) => `<tr>
        <td>${i+1}</td>
        <td>${escapeHtml(l.description)}</td>
        <td class="num">${l.quantity}</td>
        <td>${escapeHtml(l.unit)}</td>
        <td class="num">${formatCurrency(l.unitPrice)}</td>
        <td class="num">${l.discountPercent}%</td>
        <td class="num">${l.vatRate}%</td>
        <td class="num">${formatCurrency(l.total)}</td>
      </tr>`).join("")}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Imponibile</span><span>${formatCurrency(inv.subtotal)}</span></div>
    <div class="row"><span>IVA</span><span>${formatCurrency(inv.vatTotal)}</span></div>
    ${inv.stampDuty ? `<div class="row"><span>Bollo</span><span>${formatCurrency(inv.stampDuty)}</span></div>` : ""}
    ${inv.withholdingTax ? `<div class="row"><span>Rit. d'acconto</span><span>-${formatCurrency(inv.withholdingTax)}</span></div>` : ""}
    <div class="row grand"><span>TOTALE</span><span>${formatCurrency(inv.total)}</span></div>
  </div>

  ${inv.paymentMethod ? `<div style="margin-top:14px"><strong>Modalità pagamento:</strong> ${escapeHtml(inv.paymentMethod)}</div>` : ""}
  ${inv.notes ? `<div style="margin-top:8px;white-space:pre-wrap">${escapeHtml(inv.notes)}</div>` : ""}

  <div class="footer">
    Documento generato da Ampera · ${formatDateTime(new Date())}
    ${inv.sdiStatus !== "DRAFT" ? `<br>Stato SDI: ${escapeHtml(inv.sdiStatus)}` : ""}
  </div>
  <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
</body></html>`;
}

function escapeHtml(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
