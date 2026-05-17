import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document: doc });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.privacyDocument.update({ where: { id }, data: {
    signedAt: body.signedAt ? new Date(body.signedAt) : undefined,
    signatureDataUrl: body.signatureDataUrl, signerName: body.signerName,
    consentsJson: body.consentsJson, revokedAt: body.revokedAt ? new Date(body.revokedAt) : undefined,
  } });
  return NextResponse.json({ document: updated });
}
