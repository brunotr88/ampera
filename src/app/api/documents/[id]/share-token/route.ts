import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Genera/rigenera shareToken per accesso cliente senza login.
 * Body: { expiresDays?: number (default 30) }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const days = body.expiresDays || 30;
  const token = crypto.randomBytes(24).toString("base64url");
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.amperaDocument.update({
    where: { id },
    data: { shareToken: token, shareExpiresAt: expires },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "SHARE", entity: "AmperaDocument", entityId: id, meta: { expiresAt: expires.toISOString() } });
  return NextResponse.json({ token, url: `/sign/${token}`, expiresAt: expires });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.amperaDocument.update({ where: { id }, data: { shareToken: null, shareExpiresAt: null } });
  return NextResponse.json({ ok: true });
}
