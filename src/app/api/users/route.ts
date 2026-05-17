import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hasRole } from "@/lib/permissions";
import { UserCreate } from "@/lib/validators";
import bcrypt from "bcryptjs";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const users = await db.user.findMany({
    where: { tenantId: s.tenantId, active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true, phoneNumber: true, lastLoginAt: true, active: true },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  if (!hasRole(s.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parsed = UserCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const exists = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return NextResponse.json({ error: "Email già usata" }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: {
      tenantId: s.tenantId,
      email: parsed.data.email,
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash,
      phoneNumber: parsed.data.phoneNumber,
      active: true,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "User", entityId: user.id });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } }, { status: 201 });
}
