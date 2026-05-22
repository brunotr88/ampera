import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { SYSTEM_DOCUMENT_TEMPLATES } from "@/lib/document-templates";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category") || undefined;

  // Auto-bootstrap: se nessun template per il tenant, copia quelli di sistema (isSystem=true)
  const count = await db.documentTemplate.count({ where: { tenantId: s.tenantId } });
  if (count === 0) {
    await db.documentTemplate.createMany({
      data: SYSTEM_DOCUMENT_TEMPLATES.map(t => ({
        tenantId: s.tenantId,
        code: t.code, title: t.title, category: t.category,
        description: t.description, bodyTemplate: t.bodyTemplate,
        requireSignature: t.requireSignature, signerRole: t.signerRole,
        legalReference: t.legalReference || null, audience: t.audience,
        active: true, isSystem: true,
      })),
      skipDuplicates: true,
    });
  }

  const templates = await db.documentTemplate.findMany({
    where: { tenantId: s.tenantId, active: true, ...(category ? { category } : {}) },
    orderBy: [{ category: "asc" }, { title: "asc" }],
  });
  return NextResponse.json({ templates });
}
