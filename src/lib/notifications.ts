import { db } from "./db";
import { sendEmail, emailLayout } from "./mailer";

export async function sendNotification(opts: {
  tenantId: string;
  type: string;
  channel: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
  recipient: string;
  subject: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
  targetEntity?: string;
  targetId?: string;
  idempotencyKey?: string;
  meta?: any;
}) {
  if (opts.idempotencyKey) {
    const dup = await db.notificationSent.findFirst({
      where: { tenantId: opts.tenantId, type: opts.type, targetEntity: opts.targetEntity, targetId: opts.targetId },
    });
    if (dup) return { skipped: true };
  }
  if (opts.channel === "EMAIL") {
    await sendEmail({
      to: opts.recipient,
      subject: opts.subject,
      html: emailLayout(opts.subject, opts.body, opts.ctaUrl, opts.ctaLabel),
    });
  }
  await db.notificationSent.create({
    data: {
      tenantId: opts.tenantId,
      type: opts.type,
      channel: opts.channel,
      targetEntity: opts.targetEntity,
      targetId: opts.targetId,
      recipient: opts.recipient,
      meta: opts.meta,
    },
  });
  return { sent: true };
}

export async function scheduleReminder(opts: {
  tenantId: string;
  userId?: string;
  eventId?: string;
  title: string;
  body?: string;
  remindAt: Date;
  channel?: "EMAIL" | "PUSH" | "SMS" | "WHATSAPP";
  recipient?: string;
  meta?: any;
}) {
  return db.reminder.create({
    data: {
      tenantId: opts.tenantId,
      userId: opts.userId,
      eventId: opts.eventId,
      title: opts.title,
      body: opts.body,
      remindAt: opts.remindAt,
      channel: opts.channel || "EMAIL",
      recipient: opts.recipient,
      meta: opts.meta,
      status: "PENDING",
    },
  });
}

export async function processDueReminders() {
  const now = new Date();
  const due = await db.reminder.findMany({
    where: { status: "PENDING", remindAt: { lte: now } },
    take: 50,
    include: { user: true, event: true, tenant: true },
  });
  for (const r of due) {
    try {
      const recipient = r.recipient || r.user?.email;
      if (!recipient) {
        await db.reminder.update({ where: { id: r.id }, data: { status: "FAILED" } });
        continue;
      }
      if (r.channel === "EMAIL") {
        await sendEmail({
          to: recipient,
          subject: `Promemoria - ${r.title}`,
          html: emailLayout(r.title, r.body || "Promemoria programmato.", `${process.env.APP_URL || "https://ampera.isipc.com"}/admin/calendar`, "Apri calendario"),
        });
      }
      await db.reminder.update({ where: { id: r.id }, data: { status: "SENT", sentAt: new Date() } });
    } catch (e) {
      console.error("[reminder] failed", r.id, e);
      await db.reminder.update({ where: { id: r.id }, data: { status: "FAILED" } });
    }
  }

  const eventsToRemind = await db.calendarEvent.findMany({
    where: {
      reminderEmailSent: false,
      reminderMinutesBefore: { gt: 0 },
      startsAt: { gte: now, lte: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
    },
    include: { owner: true, tenant: true },
    take: 50,
  });
  for (const ev of eventsToRemind) {
    const remindAt = new Date(ev.startsAt.getTime() - ev.reminderMinutesBefore * 60_000);
    if (remindAt > now) continue;
    try {
      await sendEmail({
        to: ev.owner.email,
        subject: `${ev.title} - tra ${ev.reminderMinutesBefore} min`,
        html: emailLayout(
          `Promemoria appuntamento`,
          `<p><strong>${ev.title}</strong></p><p>Quando: ${ev.startsAt.toLocaleString("it-IT")}</p>${ev.location ? `<p>Dove: ${ev.location}</p>` : ""}${ev.description ? `<p>${ev.description}</p>` : ""}`,
          `${process.env.APP_URL || "https://ampera.isipc.com"}/admin/calendar`,
          "Apri calendario"
        ),
      });
      await db.calendarEvent.update({ where: { id: ev.id }, data: { reminderEmailSent: true } });
    } catch (e) {
      console.error("[event-reminder] failed", ev.id, e);
    }
  }

  return { processedReminders: due.length, processedEvents: eventsToRemind.length };
}

export async function processMaintenanceContracts() {
  const now = new Date();
  const upcoming = await db.maintenanceContract.findMany({
    where: { active: true, nextDueDate: { gte: now } },
    include: { customer: true, tenant: true },
    take: 100,
  });
  let scheduled = 0;
  for (const ct of upcoming) {
    const daysLeft = Math.floor((ct.nextDueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (daysLeft <= ct.notifyDaysBefore && daysLeft > 0) {
      const key = `MAINT_${ct.id}_${daysLeft}`;
      const dup = await db.notificationSent.findFirst({
        where: { tenantId: ct.tenantId, type: "MAINTENANCE_DUE", targetEntity: "MaintenanceContract", targetId: ct.id, meta: { path: ["daysLeft"], equals: daysLeft } },
      });
      if (dup) continue;
      const to = ct.customer.email || ct.tenant.email;
      if (to) {
        await sendNotification({
          tenantId: ct.tenantId,
          type: "MAINTENANCE_DUE",
          channel: "EMAIL",
          recipient: to,
          subject: `Manutenzione programmata tra ${daysLeft} giorni`,
          body: `<p>Contratto <strong>${ct.name}</strong></p><p>Scadenza: ${ct.nextDueDate.toLocaleDateString("it-IT")}</p>`,
          targetEntity: "MaintenanceContract",
          targetId: ct.id,
          meta: { daysLeft },
        });
        scheduled++;
      }
    }
  }
  return { scheduled };
}
