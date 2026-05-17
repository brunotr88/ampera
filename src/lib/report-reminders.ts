/**
 * Daily report reminder logic.
 * - At end-of-day: for each technician active today (no vacation/illness today) and NO submitted report today: send gentle reminder.
 * - After 2 days no report: notify admins.
 * Idempotent via ReportReminderSent table.
 */
import { db } from "@/lib/db";
import { sendEmail, emailLayout } from "@/lib/mailer";

const APP_URL = process.env.APP_URL || "https://ampera.isipc.com";

export async function runReportReminders() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);

  let firstReminders = 0;
  let escalations = 0;

  const tenants = await db.tenant.findMany({ where: { active: true, reportReminderEnabled: true } });

  for (const tenant of tenants) {
    const technicians = await db.user.findMany({
      where: { tenantId: tenant.id, active: true, role: { in: ["TECHNICIAN", "ADMIN", "OWNER"] } },
    });

    for (const tech of technicians) {
      // Skip if on vacation/illness today
      const onVacation = await db.vacationRequest.findFirst({
        where: {
          tenantId: tenant.id, userId: tech.id, status: "APPROVED",
          startDate: { lte: yesterday }, endDate: { gte: yesterday },
        },
      });
      if (onVacation) continue;

      // Check if they had any work-order activity yesterday (basic heuristic for "active day")
      const hadActivity = await db.workOrder.count({
        where: {
          tenantId: tenant.id, assignedToId: tech.id,
          scheduledDate: { gte: yesterday, lt: today },
        },
      });
      if (!hadActivity) continue;

      // Check if they submitted any report yesterday
      const submitted = await db.report.count({
        where: { tenantId: tenant.id, technicianId: tech.id, signedAt: { gte: yesterday, lt: today } },
      });
      if (submitted > 0) continue;

      // First reminder (yesterday's missing report)
      const alreadyFirst = await db.reportReminderSent.findFirst({
        where: { tenantId: tenant.id, userId: tech.id, reminderDate: yesterday, type: "FIRST" },
      });
      if (!alreadyFirst) {
        try {
          await sendEmail({
            to: tech.email,
            subject: `📋 Promemoria: rapportino di ieri`,
            html: emailLayout(
              "Promemoria rapportino",
              `<p>Ciao ${tech.name.split(" ")[0]},</p>
               <p>ieri (${yesterday.toLocaleDateString("it-IT")}) avevi interventi pianificati ma non risulta firmato alcun rapportino.</p>
               <p>Quando puoi, ricordati di completarlo. Grazie!</p>`,
              `${APP_URL}/operatore`,
              "Apri rapportini"
            ),
          });
          await db.reportReminderSent.create({
            data: { tenantId: tenant.id, userId: tech.id, reminderDate: yesterday, type: "FIRST", recipient: tech.email },
          });
          firstReminders++;
        } catch (e) { console.error("first reminder err", e); }
      }

      // Escalation: still no report after 2 days
      const submittedSince = await db.report.count({
        where: { tenantId: tenant.id, technicianId: tech.id, signedAt: { gte: twoDaysAgo } },
      });
      if (submittedSince === 0) {
        const alreadyEsc = await db.reportReminderSent.findFirst({
          where: { tenantId: tenant.id, userId: tech.id, reminderDate: twoDaysAgo, type: "ESCALATION" },
        });
        if (!alreadyEsc) {
          // Notify the technician + admins
          const admins = await db.user.findMany({
            where: { tenantId: tenant.id, role: { in: ["OWNER", "ADMIN"] }, active: true },
          });
          const allRecipients = [tech.email, ...admins.map(a => a.email)];
          try {
            await sendEmail({
              to: allRecipients,
              subject: `⚠ Sollecito: rapportini in attesa (${tech.name})`,
              html: emailLayout(
                `Rapportini in attesa da 2 giorni`,
                `<p>Il tecnico <strong>${tech.name}</strong> non ha firmato rapportini negli ultimi 2 giorni nonostante interventi pianificati.</p>
                 <p>Periodo coperto: dal ${twoDaysAgo.toLocaleDateString("it-IT")} ad oggi.</p>
                 <p>Verificare con il tecnico per regolarizzare la documentazione.</p>`,
                `${APP_URL}/admin/reports`,
                "Apri rapportini"
              ),
            });
            await db.reportReminderSent.create({
              data: { tenantId: tenant.id, userId: tech.id, reminderDate: twoDaysAgo, type: "ESCALATION", recipient: allRecipients.join(",") },
            });
            escalations++;
          } catch (e) { console.error("escalation err", e); }
        }
      }
    }
  }

  // Also auto-finalize any reports that are >10 min old and not yet notified
  let finalized = 0;
  const pending = await db.report.findMany({
    where: {
      status: "SUBMITTED", notifiedAt: null, cancelledAt: null,
      signedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
    },
    take: 100,
  });
  for (const r of pending) {
    try {
      const res = await fetch(`${APP_URL}/api/reports/${r.id}/auto-finalize`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env.CRON_SECRET}` },
      });
      if (res.ok) finalized++;
    } catch {}
  }

  return { firstReminders, escalations, finalized };
}
