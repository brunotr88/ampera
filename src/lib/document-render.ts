/**
 * Renderer placeholders per documenti.
 * Sostituisce {{key.path}} con il valore dal contesto.
 */

import type { Customer, Plant, Tenant, User, WorkOrder, AmperaDocument } from "@prisma/client";

export interface RenderContext {
  tenant?: Partial<Tenant>;
  customer?: Partial<Customer> & { address?: string | null };
  plant?: (Partial<Plant> & { address?: string | null }) | null;
  workOrder?: Partial<WorkOrder> | null;
  technician?: Partial<User> | null;
  user?: Partial<User> | null;
  doc?: Partial<AmperaDocument>;
  custom?: Record<string, string | number | null | undefined>;
  date?: Date;
}

function fmtDate(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("it-IT");
}
function fmtDateLong(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}
function fmtTime(d?: Date | string | null): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function get(obj: any, path: string): string {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null) return "";
    cur = cur[p];
  }
  if (cur == null) return "";
  if (cur instanceof Date) return fmtDate(cur);
  return String(cur);
}

export function renderTemplate(body: string, ctx: RenderContext): string {
  const now = ctx.date || new Date();
  const data: Record<string, any> = {
    tenant: ctx.tenant || {},
    customer: ctx.customer || {},
    plant: ctx.plant || {},
    workOrder: ctx.workOrder || {},
    technician: ctx.technician || {},
    user: ctx.user || {},
    doc: ctx.doc || {},
    custom: ctx.custom || {},
    date: fmtDate(now),
    dateLong: fmtDateLong(now),
    time: fmtTime(now),
    year: String(now.getFullYear()),
  };

  return body.replace(/\{\{([a-zA-Z][a-zA-Z0-9_.]*)\}\}/g, (_, expr) => {
    return get(data, expr);
  });
}
