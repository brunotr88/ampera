import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const q = await db.quote.findFirst({
    where: { id, tenantId: s.tenantId, deletedAt: null },
    include: { customer: true, lines: { orderBy: { position: "asc" } } },
  });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ quote: q });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const q = await db.quote.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.action === "send") {
    const customer = await db.customer.findUnique({ where: { id: q.customerId } });
    if (!customer?.email) return NextResponse.json({ error: "Email cliente mancante" }, { status: 400 });
    try {
      await sendEmail({
        to: customer.email,
        subject: `Preventivo ${q.number}/v${q.version} - ${q.title}`,
        html: emailLayout(
          `Preventivo ${q.number}`,
          `<p>Buongiorno,</p><p>in allegato/visualizzabile online il preventivo richiesto.</p>`,
          `${process.env.APP_URL || ""}/print/quote/${q.id}`,
          "Visualizza preventivo"
        ),
      });
      await db.quote.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
      await auditLog({ tenantId: s.tenantId, userId: s.id, action: "QUOTE_SENT", entity: "Quote", entityId: id });
      return NextResponse.json({ ok: true });
    } catch (e: any) {
      return NextResponse.json({ error: e.message || "Send failed" }, { status: 500 });
    }
  }

  if (body.action === "accept" || body.action === "reject") {
    const data = body.action === "accept"
      ? { status: "ACCEPTED" as const, acceptedAt: new Date() }
      : { status: "REJECTED" as const, rejectedAt: new Date() };
    const updated = await db.quote.update({ where: { id }, data });
    await auditLog({ tenantId: s.tenantId, userId: s.id, action: `QUOTE_${body.action.toUpperCase()}`, entity: "Quote", entityId: id });
    return NextResponse.json({ quote: updated });
  }

  const updated = await db.quote.update({ where: { id }, data: body });
  return NextResponse.json({ quote: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  await db.quote.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "DELETE", entity: "Quote", entityId: id });
  return NextResponse.json({ ok: true });
}
