import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Firma con tablet/signature pad (admin contesto).
 * Body: { signatureDataUrl, signedByName, signedByEmail?, signerRole? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });

  const body = await req.json();
  if (!body.signatureDataUrl) return NextResponse.json({ error: "signatureDataUrl required" }, { status: 400 });
  if (!body.signedByName) return NextResponse.json({ error: "Nome firmatario richiesto" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "—";
  const ua = req.headers.get("user-agent") || "—";

  const updated = await db.amperaDocument.update({
    where: { id },
    data: {
      signedAt: new Date(),
      signedByName: body.signedByName,
      signedByEmail: body.signedByEmail || null,
      signerRole: body.signerRole || doc.signerRole || "CUSTOMER",
      signatureType: "TABLET",
      signatureDataUrl: body.signatureDataUrl,
      signatureMeta: JSON.stringify({ ip, ua, signedAt: new Date().toISOString(), source: "admin" }),
      status: "SIGNED",
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "SIGN", entity: "AmperaDocument", entityId: id, meta: { type: "TABLET", signer: body.signedByName } });
  return NextResponse.json({ document: updated });
}
