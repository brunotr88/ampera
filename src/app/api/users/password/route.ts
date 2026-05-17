import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const s = await requireSession();
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) return NextResponse.json({ error: "Required" }, { status: 400 });
  if (newPassword.length < 10) return NextResponse.json({ error: "Min 10 caratteri" }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: s.id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Password attuale non corretta" }, { status: 401 });

  const newHash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: s.id }, data: { passwordHash: newHash } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PASSWORD_CHANGE", entity: "User", entityId: s.id });
  return NextResponse.json({ ok: true });
}
