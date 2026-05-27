import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const wo = await db.workOrder.findFirst({ where: { id, tenantId: s.tenantId, deletedAt: null } });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (wo.trackingHash) return NextResponse.json({ trackingHash: wo.trackingHash });

  const raw = `${wo.id}:${wo.code}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex").substring(0, 32);
  await db.workOrder.update({ where: { id }, data: { trackingHash: hash } });

  return NextResponse.json({ trackingHash: hash });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const wo = await db.workOrder.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!wo) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.workOrder.update({ where: { id }, data: { trackingHash: null } });
  return NextResponse.json({ ok: true });
}
