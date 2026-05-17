import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { saveFile, saveDataUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_ENTITIES = ["Report", "Customer", "Plant", "Project", "Invoice", "Quote", "WorkOrder", "MaintenanceContract", "ConformityDeclaration", "User", "Supplier", "Tenant"];

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const entityType = req.nextUrl.searchParams.get("entityType");
  const entityId = req.nextUrl.searchParams.get("entityId");
  if (!entityType || !entityId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const attachments = await db.attachment.findMany({
    where: { tenantId: s.tenantId, entityType, entityId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });
  return NextResponse.json({ attachments });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const entityType = String(form.get("entityType") || "");
    const entityId = String(form.get("entityId") || "");
    const category = String(form.get("category") || "GENERAL");
    const notes = (form.get("notes") as string) || undefined;
    if (!ALLOWED_ENTITIES.includes(entityType) || !entityId) return NextResponse.json({ error: "Invalid entity" }, { status: 400 });

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (files.length === 0) return NextResponse.json({ error: "No files" }, { status: 400 });

    const created: any[] = [];
    for (const f of files) {
      const buffer = Buffer.from(await f.arrayBuffer());
      const saved = await saveFile({ buffer, filename: f.name, mime: f.type, tenantId: s.tenantId, folder: `${entityType.toLowerCase()}-attachments` });
      const att = await db.attachment.create({
        data: {
          tenantId: s.tenantId, entityType, entityId,
          fileName: f.name, url: saved.url, mimeType: f.type,
          sizeBytes: saved.sizeBytes, category: category as any,
          uploadedById: s.id, notes,
        },
      });
      created.push(att);
    }
    await auditLog({ tenantId: s.tenantId, userId: s.id, action: "ATTACHMENT_UPLOAD", entity: entityType, entityId, meta: { count: created.length } });
    return NextResponse.json({ attachments: created }, { status: 201 });
  }

  // JSON with dataUrl
  const body = await req.json();
  const { entityType, entityId, dataUrl, fileName, category, notes } = body;
  if (!ALLOWED_ENTITIES.includes(entityType) || !entityId || !dataUrl) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const saved = await saveDataUrl({ dataUrl, filename: fileName || `file-${Date.now()}`, tenantId: s.tenantId, folder: `${entityType.toLowerCase()}-attachments` });
  const att = await db.attachment.create({
    data: {
      tenantId: s.tenantId, entityType, entityId,
      fileName: fileName || "upload", url: saved.url,
      sizeBytes: saved.sizeBytes, category: (category || "GENERAL") as any,
      uploadedById: s.id, notes,
    },
  });
  return NextResponse.json({ attachment: att }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const s = await requireSession();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const a = await db.attachment.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.attachment.delete({ where: { id } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "ATTACHMENT_DELETE", entity: a.entityType, entityId: a.entityId });
  return NextResponse.json({ ok: true });
}
