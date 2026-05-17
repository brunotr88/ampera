import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { CashbookEntryCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const cashboxId = req.nextUrl.searchParams.get("cashboxId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const entries = await db.cashbookEntry.findMany({
    where: {
      tenantId: s.tenantId,
      ...(cashboxId ? { cashboxId } : {}),
      ...(from ? { date: { gte: new Date(from) } } : {}),
      ...(to ? { date: { lte: new Date(to) } } : {}),
    },
    include: { cashbox: true },
    orderBy: { date: "desc" },
    take: 500,
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = CashbookEntryCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const entry = await tx.cashbookEntry.create({
      data: {
        tenantId: s.tenantId, createdById: s.id,
        cashboxId: data.cashboxId, date: data.date, direction: data.direction, amount: data.amount,
        category: data.category, description: data.description, counterpart: data.counterpart,
        invoiceId: data.invoiceId, customerId: data.customerId, supplierId: data.supplierId,
        documentRef: data.documentRef, paymentMethod: data.paymentMethod, notes: data.notes,
      },
    });
    const delta = data.direction === "IN" ? data.amount : -data.amount;
    await tx.cashbox.update({ where: { id: data.cashboxId }, data: { currentBalance: { increment: delta } } });

    if (data.invoiceId && data.direction === "IN") {
      const inv = await tx.invoice.findUnique({ where: { id: data.invoiceId } });
      if (inv && inv.tenantId === s.tenantId) {
        const newPaid = inv.amountPaid + data.amount;
        const status = newPaid >= inv.total - 0.01 ? "PAID" : newPaid > 0 ? "PARTIAL" : "UNPAID";
        await tx.invoice.update({ where: { id: data.invoiceId }, data: { amountPaid: newPaid, paymentStatus: status, paymentDate: status === "PAID" ? new Date() : inv.paymentDate } });
      }
    }
    return entry;
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CASHBOOK_ENTRY", entity: "CashbookEntry", entityId: result.id, meta: { direction: data.direction, amount: data.amount } });
  return NextResponse.json({ entry: result }, { status: 201 });
}
