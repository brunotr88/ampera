import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const { reason } = await req.json();
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.revokedAt) return NextResponse.json({ error: "Gia revocato" }, { status: 400 });

  const updated = await db.privacyDocument.update({
    where: { id },
    data: { revokedAt: new Date(), revokedReason: reason || "Revoca su richiesta" },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_REVOKE", entity: "PrivacyDocument", entityId: id, meta: { reason } });
  return NextResponse.json({ document: updated });
}
