import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { QuoteCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";
import { calcVatBreakdown, nextDocumentNumber, round2 } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const quotes = await db.quote.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ quotes });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = QuoteCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const last = await db.quote.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" }, select: { number: true } });
  const number = nextDocumentNumber(last?.number);

  const linesForCalc = data.lines.map(l => ({ quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: l.discountPercent, vatRate: l.vatRate }));
  const totals = calcVatBreakdown(linesForCalc);
  const discountAmount = round2(totals.subtotal * (data.discountPercent / 100));
  const final = { subtotal: round2(totals.subtotal - discountAmount), vatTotal: totals.vat, total: round2(totals.subtotal - discountAmount + totals.vat) };

  const quote = await db.quote.create({
    data: {
      tenantId: s.tenantId, customerId: data.customerId, projectId: data.projectId, number, version: 1,
      title: data.title, description: data.description, validUntil: data.validUntil,
      defaultVatRate: data.defaultVatRate, discountPercent: data.discountPercent, discountAmount,
      subtotal: final.subtotal, vatTotal: final.vatTotal, total: final.total,
      terms: data.terms, internalNotes: data.internalNotes,
      lines: { create: data.lines.map((l, i) => ({
        position: i + 1, materialId: l.materialId, code: l.code, description: l.description,
        quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice, discountPercent: l.discountPercent,
        vatRate: l.vatRate, total: round2(l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (1 + l.vatRate / 100)),
      })) },
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Quote", entityId: quote.id });
  return NextResponse.json({ quote }, { status: 201 });
}
