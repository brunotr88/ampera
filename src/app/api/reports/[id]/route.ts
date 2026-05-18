import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const report = await db.report.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { customer: true, plant: true, site: true, technician: true, timeEntries: { include: { user: true } }, materials: { include: { material: true } }, photos: true },
  });
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ report });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const r = await db.report.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.immutable && !body.forceUnlock) return NextResponse.json({ error: "Rapportino firmato, immutable. Crea un rapportino integrativo o nota credito." }, { status: 423 });

  const data: any = {};
  for (const k of ["description", "recommendations", "workType", "cause", "totalHours", "travelKm", "contactPerson", "contactId", "signerName", "totalLaborAmount", "totalMaterialAmount"]) {
    if (k in body) data[k] = body[k];
  }
  if (body.totalLaborAmount !== undefined || body.totalMaterialAmount !== undefined) {
    data.totalAmount = (body.totalLaborAmount ?? r.totalLaborAmount) + (body.totalMaterialAmount ?? r.totalMaterialAmount);
  }
  const updated = await db.report.update({ where: { id }, data });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "REPORT_UPDATE", entity: "Report", entityId: id });

  if (body.resendEmail && updated.customerId) {
    const c = await db.customer.findUnique({ where: { id: updated.customerId } });
    if (c?.email) {
      try {
        await sendEmail({ to: c.email, subject: `Rapportino ${updated.code} (aggiornato)`, html: emailLayout(`Rapportino ${updated.code}`, `<p>Buongiorno,</p><p>in allegato il rapportino dell'intervento.</p>`, `${process.env.APP_URL || ""}/print/report/${updated.id}`, "Visualizza rapportino") });
      } catch {}
    }
  }

  return NextResponse.json({ report: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const r = await db.report.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.immutable) return NextResponse.json({ error: "Rapportino firmato, immutable" }, { status: 423 });
  await db.report.update({ where: { id }, data: { deletedAt: new Date() } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "REPORT_DELETE", entity: "Report", entityId: id });
  return NextResponse.json({ ok: true });
}
