/**
 * Auto-finalize endpoint, called by cron with Bearer auth.
 * Same logic as user-triggered finalize but doesn't require session.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/mailer";
import { saveFile } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

function verifyCron(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    const a = Buffer.from(auth.slice(7));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await db.report.findUnique({
    where: { id },
    include: { customer: true, plant: true, site: true, technician: true, timeEntries: { include: { user: true } }, materials: true, photos: true },
  });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.cancelledAt) return NextResponse.json({ skipped: "cancelled" });
  if (r.notifiedAt) return NextResponse.json({ skipped: "already notified" });

  const tenant = await db.tenant.findUnique({ where: { id: r.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const recipients = new Set<string>();
  if (tenant.reportNotificationEmail) recipients.add(tenant.reportNotificationEmail);
  if (tenant.reportNotificationCcAdmins) {
    const admins = await db.user.findMany({ where: { tenantId: r.tenantId, role: { in: ["OWNER", "ADMIN"] }, active: true }, select: { email: true } });
    admins.forEach(a => recipients.add(a.email));
  }
  if (r.customer.email) recipients.add(r.customer.email);

  let pdfUrl: string | null = null;
  try {
    const { reportHtml } = await import("@/lib/pdf");
    const html = reportHtml({
      tenant, report: r, customer: r.customer, plant: r.plant, site: r.site, technician: r.technician,
      timeEntries: r.timeEntries, materials: r.materials, photos: r.photos,
    });
    const buffer = Buffer.from(html, "utf-8");
    const saved = await saveFile({ buffer, filename: `Rapportino-${r.code}.html`, mime: "text/html", tenantId: r.tenantId, folder: "report-pdfs" });
    pdfUrl = saved.url;
  } catch (e) { console.error("PDF auto save err", e); }

  if (recipients.size > 0) {
    try {
      await sendEmail({
        to: [...recipients],
        subject: `Rapportino ${r.code} - ${r.customer.companyName || r.customer.name}`,
        html: emailLayout(
          `Rapportino ${r.code}`,
          `<p>Rapportino firmato dal tecnico <strong>${r.technician.name}</strong>.</p>
           <p>Cliente: <strong>${r.customer.companyName || `${r.customer.name} ${r.customer.surname || ""}`}</strong><br/>
           Ore: ${r.totalHours?.toFixed(1) || "—"} · Materiali: ${r.materials.length}</p>`,
          `${process.env.APP_URL || "https://ampera.isipc.com"}/admin/reports/${r.id}`,
          "Apri rapportino"
        ),
      });
    } catch (e) { console.error("Email err", e); }
  }

  await db.report.update({
    where: { id }, data: { notifiedAt: new Date(), pdfStoredAt: new Date(), pdfUrl, immutable: true, customerEmailSent: r.customer.email ? true : false },
  });
  await auditLog({ tenantId: r.tenantId, action: "REPORT_AUTO_FINALIZE", entity: "Report", entityId: id, meta: { recipients: [...recipients] } });
  return NextResponse.json({ ok: true, recipients: [...recipients], pdfUrl });
}
