/**
 * Auto-finalize endpoint: locks the report and triggers notifications (email + PDF save).
 * Called from cron or after 10-min window from the done page client-side.
 * Idempotent: skip if already notified.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { sendEmail, emailLayout } from "@/lib/mailer";
import { saveFile } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const r = await db.report.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { customer: true, plant: true, site: true, technician: true, timeEntries: { include: { user: true } }, materials: true, photos: true },
  });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (r.cancelledAt) return NextResponse.json({ error: "Annullato, no finalize" }, { status: 400 });
  if (r.notifiedAt) return NextResponse.json({ ok: true, alreadyNotified: true });

  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Build recipients list
  const recipients = new Set<string>();
  if (tenant.reportNotificationEmail) recipients.add(tenant.reportNotificationEmail);
  if (tenant.reportNotificationCcAdmins) {
    const admins = await db.user.findMany({ where: { tenantId: s.tenantId, role: { in: ["OWNER", "ADMIN"] }, active: true }, select: { email: true } });
    admins.forEach(a => recipients.add(a.email));
  }
  if (r.customer.email) recipients.add(r.customer.email);

  // Save HTML "PDF" snapshot to storage (we use HTML+CSS print stylesheet; in production deploy with headless chromium for real PDF)
  let pdfUrl: string | null = null;
  try {
    const { reportHtml } = await import("@/lib/pdf");
    const html = reportHtml({
      tenant, report: r, customer: r.customer, plant: r.plant, site: r.site, technician: r.technician,
      timeEntries: r.timeEntries, materials: r.materials, photos: r.photos,
    });
    const buffer = Buffer.from(html, "utf-8");
    const saved = await saveFile({ buffer, filename: `Rapportino-${r.code}.html`, mime: "text/html", tenantId: s.tenantId, folder: "report-pdfs" });
    pdfUrl = saved.url;
  } catch (e) { console.error("PDF save error", e); }

  // Send email to recipients
  if (recipients.size > 0) {
    try {
      await sendEmail({
        to: [...recipients],
        subject: `Rapportino ${r.code} - ${r.customer.companyName || r.customer.name}`,
        html: emailLayout(
          `Rapportino ${r.code}`,
          `<p>Nuovo rapportino firmato dal tecnico <strong>${r.technician.name}</strong>.</p>
           <p>Cliente: <strong>${r.customer.companyName || `${r.customer.name} ${r.customer.surname || ""}`}</strong><br/>
           Ore: ${r.totalHours?.toFixed(1) || "—"} · Materiali: ${r.materials.length}</p>
           <p>${r.description?.substring(0, 500) || ""}</p>`,
          `${process.env.APP_URL || "https://ampera.isipc.com"}/admin/reports/${r.id}`,
          "Apri rapportino"
        ),
      });
    } catch (e) { console.error("Email send error", e); }
  }

  await db.report.update({
    where: { id }, data: { notifiedAt: new Date(), pdfStoredAt: new Date(), pdfUrl, immutable: true, customerEmailSent: r.customer.email ? true : false },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "REPORT_FINALIZE", entity: "Report", entityId: id, meta: { recipients: [...recipients] } });

  return NextResponse.json({ ok: true, recipients: [...recipients], pdfUrl });
}
