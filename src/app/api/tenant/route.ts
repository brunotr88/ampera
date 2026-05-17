import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hasRole } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  return NextResponse.json({ tenant });
}

export async function PATCH(req: NextRequest) {
  const s = await requireSession();
  if (!hasRole(s.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  delete body.id; delete body.slug; delete body.plan; delete body.planExpiresAt;
  const t = await db.tenant.update({ where: { id: s.tenantId }, data: body });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "TENANT_UPDATE" });
  return NextResponse.json({ tenant: t });
}
