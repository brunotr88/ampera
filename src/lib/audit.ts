import { db } from "./db";
import { headers } from "next/headers";

export async function auditLog(opts: {
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: any;
}) {
  try {
    let ip: string | null = null;
    let userAgent: string | null = null;
    try {
      const h = await headers();
      ip = h.get("x-forwarded-for")?.split(",")[0].trim() ?? h.get("x-real-ip");
      userAgent = h.get("user-agent");
    } catch {}
    await db.auditLog.create({
      data: {
        tenantId: opts.tenantId ?? undefined,
        userId: opts.userId ?? undefined,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId,
        meta: opts.meta ?? undefined,
        ip,
        userAgent,
      },
    });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
