/**
 * Notifica cliente al cambio di stato workflow di un WorkOrder.
 *
 * Trigger: PATCH workOrder con customStateId nuovo.
 * Idempotency: skip se stesso stato già notificato (customerEmailNotifiedAt + meta in audit).
 * Auto-genera trackingHash se mancante (così il link è incluso nel mail).
 */
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";

export interface NotifyResult {
  notified: boolean;
  reason?: string;
  email?: string;
  stateName?: string;
}

/**
 * Renderizza placeholders {{path.field}} contro un context.
 * Supporta dot-notation (es: {{customer.name}}, {{tenant.name}}).
 */
function renderTemplate(tpl: string, ctx: Record<string, any>): string {
  return tpl.replace(/\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\}/g, (_, expr: string) => {
    const parts = expr.split(".");
    let cur: any = ctx;
    for (const p of parts) {
      if (cur == null) return "";
      cur = cur[p];
    }
    if (cur == null) return "";
    if (cur instanceof Date) return cur.toLocaleString("it-IT");
    return String(cur);
  });
}

/** Auto-genera trackingHash per WO se mancante. */
async function ensureTrackingHash(workOrderId: string): Promise<string> {
  const wo = await db.workOrder.findUnique({ where: { id: workOrderId }, select: { trackingHash: true } });
  if (wo?.trackingHash) return wo.trackingHash;
  const hash = crypto.createHash("sha256")
    .update(`${workOrderId}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`)
    .digest("hex").substring(0, 32);
  await db.workOrder.update({ where: { id: workOrderId }, data: { trackingHash: hash } });
  return hash;
}

/**
 * Notifica cliente del cambio stato workflow.
 * @param workOrderId ID intervento
 * @param newStateId nuovo customStateId (può essere null se rimosso)
 * @param previousStateId stato precedente (per check idempotency)
 */
export async function notifyClientOnStateChange(
  workOrderId: string,
  newStateId: string | null,
  previousStateId: string | null,
): Promise<NotifyResult> {
  // Se nessun nuovo stato o stato non cambiato, skip
  if (!newStateId) return { notified: false, reason: "no-new-state" };
  if (newStateId === previousStateId) return { notified: false, reason: "same-state" };

  const wo = await db.workOrder.findUnique({
    where: { id: workOrderId },
    include: {
      customer: true,
      plant: true,
      assignedTo: true,
      tenant: true,
    },
  });
  if (!wo) return { notified: false, reason: "workorder-not-found" };

  const state = await db.workflowState.findUnique({ where: { id: newStateId } });
  if (!state) return { notified: false, reason: "state-not-found" };
  if (!state.triggersClientEmail) return { notified: false, reason: "state-does-not-trigger" };

  const email = wo.customer.email;
  if (!email) return { notified: false, reason: "no-customer-email", stateName: state.name };

  // Genera trackingHash se serve
  const hash = await ensureTrackingHash(wo.id);
  const trackingUrl = `${process.env.NEXTAUTH_URL || "https://ampera.isipc.com"}/track/${hash}`;

  const ctx = {
    customer: {
      name: wo.customer.companyName || `${wo.customer.name} ${wo.customer.surname || ""}`.trim(),
      email: wo.customer.email || "",
      phone: wo.customer.phone || wo.customer.mobile || "",
    },
    workOrder: {
      code: wo.code,
      title: wo.title,
      description: wo.description || "",
      scheduledDate: wo.scheduledDate ? wo.scheduledDate.toLocaleString("it-IT", { dateStyle: "long", timeStyle: "short" }) : "",
      assignedTo: { name: wo.assignedTo?.name || "" },
    },
    plant: {
      name: wo.plant?.name || "",
      address: wo.plant?.code || "",
    },
    state: {
      name: state.name,
      description: state.description || "",
      percentage: state.percentage,
    },
    tenant: {
      name: wo.tenant.name,
      email: wo.tenant.email || "",
      phone: wo.tenant.phone || "",
      address: [wo.tenant.address, wo.tenant.city].filter(Boolean).join(", "),
    },
    trackingUrl,
    date: new Date().toLocaleDateString("it-IT"),
    time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
  };

  const subject = renderTemplate(state.emailSubject || `Aggiornamento intervento ${wo.code}`, ctx);
  const body = renderTemplate(state.emailBodyHtml || `<p>Ciao {{customer.name}},</p><p>Il tuo intervento <strong>{{workOrder.code}}</strong> è ora in stato <strong>{{state.name}}</strong>.</p><p>Segui lo stato in tempo reale: <a href="{{trackingUrl}}">{{trackingUrl}}</a></p><p>{{tenant.name}}</p>`, ctx);

  try {
    await sendEmail({ to: email, subject, html: body });
    await db.workOrder.update({
      where: { id: workOrderId },
      data: { customerEmailNotifiedAt: new Date() },
    });
    await auditLog({
      tenantId: wo.tenantId,
      action: "NOTIFY_CLIENT",
      entity: "WorkOrder",
      entityId: wo.id,
      meta: { stateId: newStateId, stateName: state.name, email, trackingUrl },
    });
    return { notified: true, email, stateName: state.name };
  } catch (e: any) {
    await auditLog({
      tenantId: wo.tenantId,
      action: "NOTIFY_CLIENT_FAILED",
      entity: "WorkOrder",
      entityId: wo.id,
      meta: { error: e.message, email },
    });
    return { notified: false, reason: `email-failed: ${e.message}`, email };
  }
}
