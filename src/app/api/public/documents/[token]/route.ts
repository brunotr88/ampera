import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const doc = await db.amperaDocument.findFirst({
    where: { shareToken: token, deletedAt: null },
    select: {
      id: true, code: true, title: true, category: true, contentHtml: true, status: true,
      signedAt: true, signedByName: true, signatureType: true,
      shareExpiresAt: true, revokedAt: true,
      template: { select: { requireSignature: true, signerRole: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: "Documento non trovato o token non valido" }, { status: 404 });
  if (doc.shareExpiresAt && doc.shareExpiresAt < new Date()) {
    return NextResponse.json({ error: "Link scaduto. Contatta la ditta per riceverne uno nuovo." }, { status: 410 });
  }
  if (doc.revokedAt) return NextResponse.json({ error: "Documento revocato" }, { status: 410 });
  return NextResponse.json({ document: doc });
}
