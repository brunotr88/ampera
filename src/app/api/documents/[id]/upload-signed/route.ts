import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { saveFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Upload PDF firmato esternamente (scansione, firma digitale qualificata, ecc).
 * Body multipart: file (PDF) + signedByName + signedByEmail?
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const signedByName = (form.get("signedByName") as string) || "";
  const signedByEmail = (form.get("signedByEmail") as string) || "";

  if (!file) return NextResponse.json({ error: "File mancante" }, { status: 400 });
  if (!signedByName) return NextResponse.json({ error: "Nome firmatario richiesto" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = await saveFile({
    tenantId: s.tenantId,
    folder: "documents-signed",
    filename: file.name || `firmato-${doc.code}.pdf`,
    mime: file.type || "application/pdf",
    buffer: bytes,
  });
  const url = stored.url;

  const ip = req.headers.get("x-forwarded-for") || "—";
  const ua = req.headers.get("user-agent") || "—";

  const updated = await db.amperaDocument.update({
    where: { id },
    data: {
      signedAt: new Date(),
      signedByName,
      signedByEmail: signedByEmail || null,
      signerRole: "CUSTOMER",
      signatureType: "UPLOADED_PDF",
      signatureFileUrl: url,
      signatureMeta: JSON.stringify({ ip, ua, fileName: file.name, fileSize: bytes.length }),
      status: "SIGNED",
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "SIGN", entity: "AmperaDocument", entityId: id, meta: { type: "UPLOADED_PDF", signer: signedByName } });
  return NextResponse.json({ document: updated });
}
