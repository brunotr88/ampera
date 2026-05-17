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

  const totals = calcVatBreakdown(data.lines.map(l => ({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: l.discountPercent, vatRate: l.vatRate })));
  const grand = round2(totals.subtotal + totals.vat + data.stampDuty - data.withholdingTax);

  const invoice = await db.invoice.create({
    data: {
      tenantId: s.tenantId, customerId: data.customerId, projectId: data.projectId,
      type: data.type, number, series: data.series, issueDate: data.issueDate, dueDate: data.dueDate,
      paymentMethod: data.paymentMethod, notes: data.notes,
      subtotal: totals.subtotal, vatTotal: totals.vat, total: grand,
      withholdingTax: data.withholdingTax, splitPayment: data.splitPayment, reverseCharge: data.reverseCharge, stampDuty: data.stampDuty,
      lines: { create: data.lines.map((l, i) => ({
        position: i + 1, code: l.code, description: l.description, quantity: l.quantity, unit: l.unit,
        unitPrice: l.unitPrice, discountPercent: l.discountPercent, vatRate: l.vatRate,
        total: round2(l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (1 + l.vatRate / 100)),
      })) },
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Invoice", entityId: invoice.id });
  return NextResponse.json({ invoice }, { status: 201 });
}
