/**
 * Sign a privacy document with signature pad data + tracking (IP, UA, timestamp).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { saveDataUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json();
  if (!body.signatureDataUrl || !body.signerName) {
    return NextResponse.json({ error: "Firma e nome firmatario obbligatori" }, { status: 400 });
  }
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.signedAt) return NextResponse.json({ error: "Gia firmato" }, { status: 400 });
  if (doc.revokedAt) return NextResponse.json({ error: "Documento revocato" }, { status: 400 });

  // Save signature to storage
  let sigUrl: string;
  try {
    const saved = await saveDataUrl({ dataUrl: body.signatureDataUrl, filename: `privacy-sig-${id}.png`, tenantId: s.tenantId, folder: "privacy-signatures" });
    sigUrl = saved.url;
  } catch (e) {
    sigUrl = body.signatureDataUrl;
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ua = req.headers.get("user-agent") || "";

  const updated = await db.privacyDocument.update({
    where: { id },
    data: {
      signedAt: new Date(),
      signatureDataUrl: sigUrl,
      signerName: body.signerName,
      ipAddress: ip,
      userAgent: ua,
      consentsJson: body.consents || doc.consentsJson,
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "PRIVACY_SIGN", entity: "PrivacyDocument", entityId: id, meta: { signerName: body.signerName } });
  return NextResponse.json({ document: updated });
}
