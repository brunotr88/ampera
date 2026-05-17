import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const user = await db.user.findUnique({
    where: { id: s.id },
    select: { id: true, email: true, name: true, role: true, phoneNumber: true, avatarUrl: true, lastLoginAt: true, totpEnabled: true, isSuperAdmin: true },
  });
  return NextResponse.json({ user });
}
