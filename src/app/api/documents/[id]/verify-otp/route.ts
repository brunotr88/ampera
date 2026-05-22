import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function hashOtp(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(`${otp}:${salt}`).digest("hex");
}

/**
 * Verifica OTP + firma documento.
 * Body: { otp: string, signedByName: string, signedByEmail?: string }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });
  if (!doc.otpHash || !doc.otpExpiresAt) return NextResponse.json({ error: "Nessun OTP attivo, invialo prima" }, { status: 400 });
  if (doc.otpExpiresAt < new Date()) return NextResponse.json({ error: "OTP scaduto" }, { status: 410 });
  if (doc.otpAttempts >= 5) return NextResponse.json({ error: "Troppi tentativi" }, { status: 429 });

  const body = await req.json();
  const otp = (body.otp || "").trim();
  if (!otp.match(/^\d{6}$/)) return NextResponse.json({ error: "OTP non valido" }, { status: 400 });
  if (!body.signedByName) return NextResponse.json({ error: "Nome firmatario richiesto" }, { status: 400 });

  const hash = hashOtp(otp, doc.id);
  if (hash !== doc.otpHash) {
    await db.amperaDocument.update({ where: { id }, data: { otpAttempts: { increment: 1 } } });
    return NextResponse.json({ error: "OTP errato" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "—";
  const ua = req.headers.get("user-agent") || "—";

  const updated = await db.amperaDocument.update({
    where: { id },
    data: {
      signedAt: new Date(),
      signedByName: body.signedByName,
      signedByEmail: body.signedByEmail || doc.sentTo || null,
      signerRole: "CUSTOMER",
      signatureType: "OTP",
      signatureMeta: JSON.stringify({ ip, ua, otpSentTo: doc.sentTo, source: "admin-otp" }),
      status: "SIGNED",
      otpHash: null,
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "SIGN", entity: "AmperaDocument", entityId: id, meta: { type: "OTP", signer: body.signedByName } });
  return NextResponse.json({ document: updated });
}
