import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/utils";

function esc(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export default async function PrintDico({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const d = await db.conformityDeclaration.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { plant: { include: { customer: { include: { addresses: true } } } } },
  });
  if (!d) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  const checklist = (d.checklistJson as Record<string, boolean>) || {};

  const html = `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>DICO ${d.number}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  body { font-family:-apple-system,sans-serif; font-size: 11px; color:#111; margin: 0; line-height: 1.4; }
  .header { border-bottom: 3px solid #1D4ED8; padding-bottom: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; }
  h1 { color: #1D4ED8; margin: 0; font-size: 22px; }
  h2 { color: #1D4ED8; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin: 12px 0 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .card { border: 1px solid #ccc; padding: 8px; border-radius: 4px; }
  ul { padding-left: 14px; margin: 6px 0; }
  li { padding: 2px 0; }
  .footer { margin-top: 30px; font-size: 10px; color: #6b7280; }
  .sig { margin-top: 30px; border-top: 1px solid #6b7280; padding-top: 4px; }
  @media print { body { print-color-adjust: exact; } }
</style></head><body>
<div class="header">
  <div>
    <h1>${esc(tenant?.name)}</h1>
    ${tenant?.vatNumber ? `<div style="font-size:11px">P.IVA ${esc(tenant.vatNumber)}</div>` : ""}
    ${tenant?.address ? `<div style="font-size:11px">${esc([tenant.address, tenant.city, tenant.province, tenant.zip].filter(Boolean).join(", "))}</div>` : ""}
  </div>
  <div style="text-align:right">
    <strong>DICHIARAZIONE DI CONFORMITA</strong><br/>
    <span style="font-size:10px;color:#6b7280">D.M. 22 gennaio 2008, n. 37</span><br/>
    <strong>${esc(d.number)}</strong>
    ${d.issueDate ? `<br/><span style="font-size:10px">Emessa il ${formatDate(d.issueDate)}</span>` : ""}
  </div>
</div>

<h2>Committente / Destinatario</h2>
<div class="card">
  <strong>${esc(d.plant.customer.companyName || `${d.plant.customer.name} ${d.plant.customer.surname || ""}`)}</strong><br/>
  ${d.plant.customer.vatNumber ? `P.IVA ${esc(d.plant.customer.vatNumber)} · ` : ""}${d.plant.customer.fiscalCode ? `CF ${esc(d.plant.customer.fiscalCode)}` : ""}<br/>
  ${d.plant.customer.addresses[0] ? esc([d.plant.customer.addresses[0].street, d.plant.customer.addresses[0].city, d.plant.customer.addresses[0].province, d.plant.customer.addresses[0].zip].filter(Boolean).join(", ")) : ""}
</div>

<h2>Impianto oggetto della dichiarazione</h2>
<div class="card">
  <strong>${esc(d.plant.name)}</strong> · Tipo: ${esc(d.plant.type)}
  ${d.plant.code ? ` · Codice: ${esc(d.plant.code)}` : ""}<br/>
  ${d.plant.installDate ? `Installato: ${formatDate(d.plant.installDate)} · ` : ""}
  ${d.plant.ratedPowerKw ? `Potenza: ${d.plant.ratedPowerKw} kW · ` : ""}
  ${d.plant.voltageV ? `Tensione: ${d.plant.voltageV} V` : ""}
</div>

<h2>Responsabile Tecnico (RT)</h2>
<div class="card">
  Cognome e Nome: <strong>${esc(d.rtName || "—")}</strong><br/>
  Iscrizione CCIAA: ${esc(d.rtRegistrationNo || "—")}
</div>

<h2>Dichiarazione</h2>
<p>Il sottoscritto, in qualita di legale rappresentante / responsabile tecnico dell'impresa ${esc(tenant?.name)} con sede in ${esc([tenant?.address, tenant?.city, tenant?.province].filter(Boolean).join(", "))}, dichiara sotto la propria responsabilita che <strong>l'impianto sopra descritto e stato realizzato in modo conforme alla regola dell'arte</strong>, secondo quanto previsto dall'art. 6 del DM 37/08, tenuto conto delle condizioni di esercizio e degli usi a cui e destinato, avendo in particolare:</p>
<ul>
  <li>rispettato il progetto redatto ai sensi dell'articolo 5 (ove richiesto)</li>
  <li>installato componenti e materiali costruiti a regola d'arte ai sensi dell'art. 6, c. 2</li>
  <li>controllato l'impianto ai fini della sicurezza e della funzionalita con esito positivo</li>
  <li>rispettato le norme CEI vigenti per la categoria di intervento</li>
</ul>

<h2>Allegati obbligatori</h2>
<ul>
  ${Object.entries(checklist).length === 0 ? "<li>Da definire</li>" : Object.entries(checklist).map(([k, v]) => `<li>${v ? "☑" : "☐"} ${esc(k)}</li>`).join("")}
</ul>

${d.sentToInailAt ? `<h2>Trasmissione</h2><p>Inviata all'INAIL/ASL il ${formatDate(d.sentToInailAt)} ${d.inailReceipt ? `(protocollo ${esc(d.inailReceipt)})` : ""}.</p>` : ""}

<div style="margin-top:30px;display:flex;gap:30px">
  <div style="flex:1">
    <div>Luogo, ${esc(tenant?.city || "—")} - Data ${d.issueDate ? formatDate(d.issueDate) : "____"}</div>
  </div>
  <div style="flex:1">
    <div>Il dichiarante (timbro e firma)</div>
    <div class="sig">${esc(d.rtName || "_______________________")}</div>
  </div>
</div>

<div class="footer">DICO generata da Ampera · ${formatDateTime(new Date())} · Conforme DM 37/08</div>
<script>setTimeout(()=>{if(location.search.includes('print=1'))window.print()},300)</script>
</body></html>`;

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
