import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

function hashOtp(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(`${otp}:${salt}`).digest("hex");
}

/**
 * Firma da pagina pubblica via shareToken.
 * Body azioni:
 *  { action: "tablet", signatureDataUrl, signedByName, signedByEmail? }
 *  { action: "send-otp", email }
 *  { action: "verify-otp", otp, signedByName, signedByEmail? }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = await db.amperaDocument.findFirst({
    where: { shareToken: token, deletedAt: null },
    include: { tenant: true, template: true },
  });
  if (!doc) return NextResponse.json({ error: "Token non valido" }, { status: 404 });
  if (doc.shareExpiresAt && doc.shareExpiresAt < new Date()) return NextResponse.json({ error: "Scaduto" }, { status: 410 });
  if (doc.revokedAt) return NextResponse.json({ error: "Revocato" }, { status: 410 });

  const body = await req.json();
  const action = body.action;
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "—";
  const ua = req.headers.get("user-agent") || "—";

  if (action === "tablet") {
    if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });
    if (!body.signatureDataUrl) return NextResponse.json({ error: "Firma mancante" }, { status: 400 });
    if (!body.signedByName) return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });

    const updated = await db.amperaDocument.update({
      where: { id: doc.id },
      data: {
        signedAt: new Date(),
        signedByName: body.signedByName,
        signedByEmail: body.signedByEmail || null,
        signerRole: "CUSTOMER",
        signatureType: "TABLET",
        signatureDataUrl: body.signatureDataUrl,
        signatureMeta: JSON.stringify({ ip, ua, source: "public-link" }),
        status: "SIGNED",
      },
    });
    return NextResponse.json({ ok: true, signedAt: updated.signedAt });
  }

  if (action === "send-otp") {
    if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });
    const email = (body.email || "").trim();
    if (!email.match(/^[^@]+@[^@]+$/)) return NextResponse.json({ error: "Email non valida" }, { status: 400 });

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
    const otpHash = hashOtp(otp, doc.id);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.amperaDocument.update({
      where: { id: doc.id },
      data: { otpHash, otpSentAt: new Date(), otpAttempts: 0, otpExpiresAt: expiresAt, sentTo: email },
    });

    try {
      await sendEmail({
        to: email,
        subject: `[${doc.tenant.name}] Codice firma documento ${doc.code}`,
        html: `<p>Codice per firmare il documento <strong>${doc.title}</strong>:</p>
          <p style="font-size:32px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;text-align:center;font-family:monospace;">${otp}</p>
          <p>Valido 15 minuti. Non condividere questo codice.</p>`,
      });
    } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
    return NextResponse.json({ ok: true, expiresAt });
  }

  if (action === "verify-otp") {
    if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });
    if (!doc.otpHash || !doc.otpExpiresAt) return NextResponse.json({ error: "Nessun OTP attivo" }, { status: 400 });
    if (doc.otpExpiresAt < new Date()) return NextResponse.json({ error: "OTP scaduto" }, { status: 410 });
    if (doc.otpAttempts >= 5) return NextResponse.json({ error: "Troppi tentativi" }, { status: 429 });

    const otp = (body.otp || "").trim();
    if (!otp.match(/^\d{6}$/)) return NextResponse.json({ error: "OTP formato errato" }, { status: 400 });
    if (!body.signedByName) return NextResponse.json({ error: "Nome richiesto" }, { status: 400 });

    if (hashOtp(otp, doc.id) !== doc.otpHash) {
      await db.amperaDocument.update({ where: { id: doc.id }, data: { otpAttempts: { increment: 1 } } });
      return NextResponse.json({ error: "OTP errato" }, { status: 401 });
    }

    const updated = await db.amperaDocument.update({
      where: { id: doc.id },
      data: {
        signedAt: new Date(),
        signedByName: body.signedByName,
        signedByEmail: body.signedByEmail || doc.sentTo || null,
        signerRole: "CUSTOMER",
        signatureType: "OTP",
        signatureMeta: JSON.stringify({ ip, ua, otpSentTo: doc.sentTo, source: "public-link-otp" }),
        status: "SIGNED",
        otpHash: null,
      },
    });
    return NextResponse.json({ ok: true, signedAt: updated.signedAt });
  }

  return NextResponse.json({ error: "Azione non riconosciuta" }, { status: 400 });
}
