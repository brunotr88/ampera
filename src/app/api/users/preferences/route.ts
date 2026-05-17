import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  let pref = await db.userPreference.findUnique({ where: { userId: s.id } });
  if (!pref) pref = await db.userPreference.create({ data: { userId: s.id, tenantId: s.tenantId } });
  return NextResponse.json({ preferences: pref });
}

export async function PATCH(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const data: any = {};
  for (const k of ["theme", "language", "density", "emailDigest", "hideTips", "defaultLandingPath", "shortcutsEnabled"]) {
    if (k in body) data[k] = body[k];
  }
  const pref = await db.userPreference.upsert({
    where: { userId: s.id },
    update: data,
    create: { userId: s.id, tenantId: s.tenantId, ...data },
  });
  return NextResponse.json({ preferences: pref });
}
