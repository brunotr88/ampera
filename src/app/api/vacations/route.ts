import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hasRole } from "@/lib/permissions";
import { VacationRequestCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/mailer";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const status = req.nextUrl.searchParams.get("status");
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const requests = await db.vacationRequest.findMany({
    where: { tenantId: s.tenantId, ...(status ? { status: status as any } : {}), ...(mine ? { userId: s.id } : {}) },
    include: { user: true, approvedBy: true },
    orderBy: { startDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = VacationRequestCreate.safeParse({ ...body, userId: body.userId || s.id });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const v = await db.vacationRequest.create({ data: { tenantId: s.tenantId, ...parsed.data } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "VacationRequest", entityId: v.id });
  // Notify owners/admins
  try {
    const approvers = await db.user.findMany({ where: { tenantId: s.tenantId, role: { in: ["OWNER", "ADMIN"] }, active: true } });
    for (const a of approvers) {
      await sendEmail({
        to: a.email,
        subject: `Nuova richiesta ferie da approvare`,
        html: emailLayout(`Richiesta ferie da ${s.name}`, `<p>Tipo: ${parsed.data.type}</p><p>Periodo: ${parsed.data.startDate.toLocaleDateString("it-IT")} - ${parsed.data.endDate.toLocaleDateString("it-IT")}</p>${parsed.data.reason ? `<p>Motivo: ${parsed.data.reason}</p>` : ""}`, `${process.env.APP_URL || ""}/admin/vacations`, "Apri richieste"),
      });
    }
  } catch (e) { console.error("vacation notify err", e); }
  return NextResponse.json({ request: v }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await requireSession();
  if (!hasRole(s.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { id, action, reason } = body;
  const v = await db.vacationRequest.findFirst({ where: { id, tenantId: s.tenantId }, include: { user: true } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (action === "approve") {
    const upd = await db.vacationRequest.update({ where: { id }, data: { status: "APPROVED", approvedById: s.id, approvedAt: new Date() } });
    try { await sendEmail({ to: v.user.email, subject: "Ferie approvate", html: emailLayout("Richiesta ferie approvata", `<p>La tua richiesta dal ${v.startDate.toLocaleDateString("it-IT")} al ${v.endDate.toLocaleDateString("it-IT")} è stata approvata.</p>`) }); } catch {}
    return NextResponse.json({ request: upd });
  }
  if (action === "reject") {
    const upd = await db.vacationRequest.update({ where: { id }, data: { status: "REJECTED", rejectedReason: reason, approvedById: s.id, approvedAt: new Date() } });
    try { await sendEmail({ to: v.user.email, subject: "Ferie respinte", html: emailLayout("Richiesta ferie respinta", `<p>La tua richiesta è stata respinta.</p>${reason ? `<p>Motivo: ${reason}</p>` : ""}`) }); } catch {}
    return NextResponse.json({ request: upd });
  }
  return NextResponse.json({ error: "Bad action" }, { status: 400 });
}
