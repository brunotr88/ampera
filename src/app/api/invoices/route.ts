import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { InvoiceCreate } from "@/lib/validators";
import { calcVatBreakdown, nextDocumentNumber, round2 } from "@/lib/utils";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const invoices = await db.invoice.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { customer: true },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = InvoiceCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const last = await db.invoice.findFirst({ where: { tenantId: s.tenantId, type: data.type }, orderBy: { createdAt: "desc" }, select: { number: true } });
  const number = nextDocumentNumber(last?.number);

  const lineComputed = data.lines.map(l => {
    const gross = l.quantity * l.unitPrice;
    const afterPct = gross * (1 - l.discountPercent / 100);
    const imponibile = Math.max(0, afterPct - (l.discountAmount || 0));
    const vat = imponibile * (l.vatRate / 100);
    return { imponibile, vat, total: imponibile + vat };
  });
  const subtotal = round2(lineComputed.reduce((s, l) => s + l.imponibile, 0));
  const vatTotal = round2(lineComputed.reduce((s, l) => s + l.vat, 0));
  const grand = round2(subtotal + vatTotal + data.stampDuty - data.withholdingTax);

  const invoice = await db.invoice.create({
    data: {
      tenantId: s.tenantId, customerId: data.customerId, projectId: data.projectId,
      type: data.type, number, series: data.series, issueDate: data.issueDate, dueDate: data.dueDate,
      paymentMethod: data.paymentMethod, notes: data.notes,
      subtotal, vatTotal, total: grand,
      withholdingTax: data.withholdingTax, splitPayment: data.splitPayment, reverseCharge: data.reverseCharge, stampDuty: data.stampDuty,
      lines: { create: data.lines.map((l, i) => ({
        position: i + 1, code: l.code, description: l.description, quantity: l.quantity, unit: l.unit,
        unitPrice: l.unitPrice, discountPercent: l.discountPercent, discountAmount: l.discountAmount || 0,
        vatRate: l.vatRate, vatExemptionCode: l.vatExemptionCode, vatNote: l.vatNote, incentiveCode: l.incentiveCode,
        total: round2(lineComputed[i].total),
      })) },
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Invoice", entityId: invoice.id });
  return NextResponse.json({ invoice }, { status: 201 });
}
