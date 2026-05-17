import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { sendEmail, emailLayout } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const q = await db.quote.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const customer = await db.customer.findUnique({ where: { id: q.customerId } });
  const base = new URL(req.url).origin;
  if (!customer?.email) {
    return NextResponse.redirect(new URL(`/admin/quotes/${id}?error=no_email`, base));
  }
  try {
    await sendEmail({
      to: customer.email,
      subject: `Preventivo ${q.number}/v${q.version} - ${q.title}`,
      html: emailLayout(`Preventivo ${q.number}`, `<p>Buongiorno,</p><p>in allegato il preventivo richiesto.</p>`, `${process.env.APP_URL || ""}/print/quote/${q.id}`, "Visualizza"),
    });
    await db.quote.update({ where: { id }, data: { status: "SENT", sentAt: new Date() } });
    await auditLog({ tenantId: s.tenantId, userId: s.id, action: "QUOTE_SENT", entity: "Quote", entityId: id });
  } catch {}
  return NextResponse.redirect(new URL(`/admin/quotes/${id}?sent=1`, base));
}
