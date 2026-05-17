/**
 * Generazione XML FatturaPA 1.9.1 conforme allo standard SDI.
 * Scope MVP: genera l'XML che puo' essere inviato a SDI tramite intermediario
 * accreditato (Aruba/Infocert). L'invio diretto al SDI richiede certificato.
 */
import { formatDate } from "./utils";

function esc(s: any): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function fmt(n: number, dec = 2) {
  return (Math.round((n + Number.EPSILON) * 100) / 100).toFixed(dec);
}

function tipoDoc(type: string): string {
  return ({ INVOICE: "TD01", CREDIT_NOTE: "TD04", PROFORMA: "TD06", TD24_DEFERRED: "TD24", TD20_SELF: "TD20" } as Record<string, string>)[type] || "TD01";
}

export function generateInvoiceXml(opts: { tenant: any; invoice: any; customer: any; lines: any[] }): string {
  const t = opts.tenant;
  const inv = opts.invoice;
  const c = opts.customer;
  const formato = "FPR12";
  const codDest = c.sdiCode && c.sdiCode.length === 7 ? c.sdiCode : "0000000";
  const progressivo = String(inv.number).replace(/\D/g, "").padStart(5, "0").slice(-5);

  const linesByVat = new Map<number, { imponibile: number; imposta: number; natura?: string }>();
  for (const l of opts.lines) {
    const k = l.vatRate;
    const imp = l.total / (1 + k / 100);
    const iva = l.total - imp;
    const cur = linesByVat.get(k) || { imponibile: 0, imposta: 0 };
    cur.imponibile += imp;
    cur.imposta += iva;
    linesByVat.set(k, cur);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="${formato}" xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${esc(t.vatNumber || "00000000000")}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${progressivo}</ProgressivoInvio>
      <FormatoTrasmissione>${formato}</FormatoTrasmissione>
      <CodiceDestinatario>${esc(codDest)}</CodiceDestinatario>
      ${c.pec && codDest === "0000000" ? `<PECDestinatario>${esc(c.pec)}</PECDestinatario>` : ""}
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${esc(t.vatNumber || "")}</IdCodice></IdFiscaleIVA>
        ${t.fiscalCode ? `<CodiceFiscale>${esc(t.fiscalCode)}</CodiceFiscale>` : ""}
        <Anagrafica><Denominazione>${esc(t.name)}</Denominazione></Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(t.address || "—")}</Indirizzo>
        <CAP>${esc(t.zip || "00000")}</CAP>
        <Comune>${esc(t.city || "—")}</Comune>
        ${t.province ? `<Provincia>${esc(t.province)}</Provincia>` : ""}
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${c.vatNumber ? `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${esc(c.vatNumber)}</IdCodice></IdFiscaleIVA>` : ""}
        ${c.fiscalCode ? `<CodiceFiscale>${esc(c.fiscalCode)}</CodiceFiscale>` : ""}
        <Anagrafica>
          ${c.companyName ? `<Denominazione>${esc(c.companyName)}</Denominazione>` : `<Nome>${esc(c.name)}</Nome><Cognome>${esc(c.surname || "")}</Cognome>`}
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>—</Indirizzo>
        <CAP>00000</CAP>
        <Comune>—</Comune>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${tipoDoc(inv.type)}</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${formatDate(inv.issueDate, "yyyy-MM-dd")}</Data>
        <Numero>${esc(inv.number)}${inv.series ? `/${esc(inv.series)}` : ""}</Numero>
        ${inv.stampDuty ? `<DatiBollo><BolloVirtuale>SI</BolloVirtuale><ImportoBollo>${fmt(inv.stampDuty)}</ImportoBollo></DatiBollo>` : ""}
        <ImportoTotaleDocumento>${fmt(inv.total)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${opts.lines.map((l, i) => `<DettaglioLinee>
        <NumeroLinea>${i + 1}</NumeroLinea>
        <Descrizione>${esc(l.description)}</Descrizione>
        <Quantita>${fmt(l.quantity, 5)}</Quantita>
        <UnitaMisura>${esc(l.unit || "pz")}</UnitaMisura>
        <PrezzoUnitario>${fmt(l.unitPrice, 5)}</PrezzoUnitario>
        ${l.discountPercent ? `<ScontoMaggiorazione><Tipo>SC</Tipo><Percentuale>${fmt(l.discountPercent)}</Percentuale></ScontoMaggiorazione>` : ""}
        <PrezzoTotale>${fmt(l.total / (1 + l.vatRate / 100))}</PrezzoTotale>
        <AliquotaIVA>${fmt(l.vatRate)}</AliquotaIVA>
      </DettaglioLinee>`).join("\n      ")}
      ${[...linesByVat.entries()].map(([rate, sums]) => `<DatiRiepilogo>
        <AliquotaIVA>${fmt(rate)}</AliquotaIVA>
        <ImponibileImporto>${fmt(sums.imponibile)}</ImponibileImporto>
        <Imposta>${fmt(sums.imposta)}</Imposta>
        <EsigibilitaIVA>${inv.splitPayment ? "S" : "I"}</EsigibilitaIVA>
      </DatiRiepilogo>`).join("\n      ")}
    </DatiBeniServizi>
    ${inv.paymentMethod ? `<DatiPagamento>
      <CondizioniPagamento>TP02</CondizioniPagamento>
      <DettaglioPagamento>
        <ModalitaPagamento>MP05</ModalitaPagamento>
        ${inv.dueDate ? `<DataScadenzaPagamento>${formatDate(inv.dueDate, "yyyy-MM-dd")}</DataScadenzaPagamento>` : ""}
        <ImportoPagamento>${fmt(inv.total)}</ImportoPagamento>
      </DettaglioPagamento>
    </DatiPagamento>` : ""}
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}
