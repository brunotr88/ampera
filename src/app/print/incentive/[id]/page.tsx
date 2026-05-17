import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { INCENTIVES, generateBankTransferText } from "@/lib/incentives";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

function esc(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

export default async function PrintIncentive({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const app = await db.incentiveApplication.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!app) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  const def = INCENTIVES.find(i => i.type === app.type);
  const customer = app.customerId ? await db.customer.findUnique({ where: { id: app.customerId } }) : null;

  const bankText = def && tenant?.vatNumber ? generateBankTransferText({
    incentive: def, beneficiaryFiscalCode: customer?.fiscalCode || "[CF cliente]", companyVat: tenant.vatNumber, invoiceNumber: app.code,
  }) : "";

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Pratica ${app.code}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  body { font-family: -apple-system,Segoe UI,Roboto,sans-serif; font-size: 12px; color: #111; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1D4ED8; padding-bottom: 12px; margin-bottom: 16px; }
  .brand h1 { margin: 0; color: #1D4ED8; font-size: 22px; }
  h2 { color: #1D4ED8; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; margin: 18px 0 6px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px 12px; }
  .totals { background: #d1fae5; border-radius: 6px; padding: 14px; display: flex; justify-content: space-around; text-align: center; margin: 12px 0; }
  .totals .num { font-size: 22px; font-weight: 700; color: #047857; }
  .totals .lbl { font-size: 10px; color: #065f46; text-transform: uppercase; }
  pre { background: #f3f4f6; border: 1px solid #d1d5db; padding: 10px; border-radius: 4px; font-size: 11px; white-space: pre-wrap; }
  ul { padding-left: 18px; }
  ul li { padding: 3px 0; }
  .mention { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px; margin: 10px 0; font-family: monospace; font-size: 11px; }
  .footer { margin-top: 25px; text-align: center; color: #6b7280; font-size: 10px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
</style></head><body>
  <div class="header">
    <div class="brand"><h1>${esc(tenant?.name)}</h1>${tenant?.vatNumber ? `<div style="color:#6b7280;font-size:11px">P.IVA ${esc(tenant.vatNumber)}</div>` : ""}</div>
    <div style="text-align:right"><strong>Pratica agevolazione</strong><br>${esc(app.code)}<br>${formatDate(app.createdAt)}</div>
  </div>

  <h2>${esc(def?.label || app.type)}</h2>
  <div class="card"><strong>Normativa:</strong> ${esc(def?.normative || "—")}<br>${def?.description ? esc(def.description) : ""}</div>

  <div class="grid">
    <div class="card">
      <strong>Cliente</strong><br>
      ${customer ? esc(customer.companyName || `${customer.name} ${customer.surname || ""}`) : "[non assegnato]"}<br>
      ${customer?.fiscalCode ? `CF: ${esc(customer.fiscalCode)}<br>` : ""}
      ${customer?.vatNumber ? `P.IVA: ${esc(customer.vatNumber)}<br>` : ""}
    </div>
    <div class="card">
      <strong>Periodo lavori</strong><br>
      ${app.workStartDate ? `Inizio: ${formatDate(app.workStartDate)}<br>` : ""}
      ${app.workEndDate ? `Fine: ${formatDate(app.workEndDate)}<br>` : ""}
      <strong>Stato:</strong> ${esc(app.status)}
    </div>
  </div>

  <h2>Descrizione lavori</h2>
  <div class="card" style="white-space:pre-wrap">${esc(app.workDescription)}</div>

  <div class="totals">
    <div><div class="num">${formatCurrency(app.totalAmount)}</div><div class="lbl">Investimento</div></div>
    <div><div class="num">${formatCurrency(app.deductibleAmount)}</div><div class="lbl">Detrazione (${app.deductiblePercentage}%)</div></div>
    <div><div class="num">${formatCurrency(app.yearlyAmount)}</div><div class="lbl">Quota annua x ${app.yearsOfRecovery}y</div></div>
  </div>

  ${bankText ? `<h2>Bonifico parlante (causale)</h2><pre>${esc(bankText)}</pre>` : ""}

  ${def?.required.invoiceMention ? `<h2>Dicitura obbligatoria in fattura</h2><div class="mention">${esc(def.required.invoiceMention)}</div>` : ""}

  ${def?.required.documents.length ? `<h2>Checklist documenti</h2><ul>${def.required.documents.map(d => `<li>☐ ${esc(d)}</li>`).join("")}</ul>` : ""}

  ${def?.required.enéa ? `<div style="background:#fef3c7;padding:8px;border-radius:4px;margin-top:10px"><strong>⚠ COMUNICAZIONE ENEA OBBLIGATORIA${def.required.enéaWithinDays ? ` entro ${def.required.enéaWithinDays} giorni dalla fine lavori` : ""}.</strong> Portale: https://detrazionifiscali.enea.it</div>` : ""}
  ${def?.required.asseveration ? `<div style="background:#fef3c7;padding:8px;border-radius:4px;margin-top:10px"><strong>⚠ ASSEVERAZIONE TECNICA RICHIESTA</strong> firmata da professionista abilitato (ingegnere/architetto/perito iscritto all'albo).</div>` : ""}

  <div class="footer">Documento generato da Ampera · ${formatDateTime(new Date())} · Conforme normativa al ${formatDate(new Date())}</div>
  <script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
</body></html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
