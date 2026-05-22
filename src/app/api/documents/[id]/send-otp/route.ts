import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { sendEmail } from "@/lib/mailer";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

function hashOtp(otp: string, salt: string): string {
  return crypto.createHash("sha256").update(`${otp}:${salt}`).digest("hex");
}

/**
 * Genera OTP 6 cifre, lo salva (hash) e lo invia via email al cliente.
 * Body: { email: string, expiresMinutes?: number }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId }, include: { template: true } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (doc.signedAt) return NextResponse.json({ error: "Già firmato" }, { status: 409 });

  const body = await req.json();
  const email = (body.email || "").trim();
  if (!email.match(/^[^@]+@[^@]+$/)) return NextResponse.json({ error: "Email non valida" }, { status: 400 });

  // 6-digit OTP
  const otp = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const otpHash = hashOtp(otp, doc.id);
  const expiresAt = new Date(Date.now() + (body.expiresMinutes || 15) * 60 * 1000);

  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });

  await db.amperaDocument.update({
    where: { id },
    data: { otpHash, otpSentAt: new Date(), otpAttempts: 0, otpExpiresAt: expiresAt, sentTo: email },
  });

  try {
    await sendEmail({
      to: email,
      subject: `[${tenant?.name || "Ampera"}] Codice firma documento ${doc.code}`,
      html: `
        <p>Gentile cliente,</p>
        <p>Per firmare il documento <strong>${doc.title}</strong> (prot. ${doc.code}) usa il codice sotto riportato:</p>
        <p style="font-size:32px;letter-spacing:6px;font-weight:bold;background:#f4f4f4;padding:16px;text-align:center;font-family:monospace;">
          ${otp}
        </p>
        <p>Valido per ${body.expiresMinutes || 15} minuti.</p>
        <p>Se non hai richiesto questa firma, ignora questa email.</p>
        <p style="font-size:12px;color:#666;">— ${tenant?.name || "Ampera"}<br>${tenant?.email || ""}</p>
      `,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `Errore invio email: ${e.message}` }, { status: 500 });
  }

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "SEND_OTP", entity: "AmperaDocument", entityId: id, meta: { email } });
  return NextResponse.json({ ok: true, expiresAt });
}
