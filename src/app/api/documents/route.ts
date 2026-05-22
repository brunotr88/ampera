import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { renderTemplate } from "@/lib/document-render";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const sp = req.nextUrl.searchParams;
  const customerId = sp.get("customerId") || undefined;
  const plantId = sp.get("plantId") || undefined;
  const workOrderId = sp.get("workOrderId") || undefined;

  const documents = await db.amperaDocument.findMany({
    where: {
      tenantId: s.tenantId,
      deletedAt: null,
      ...(customerId ? { customerId } : {}),
      ...(plantId ? { plantId } : {}),
      ...(workOrderId ? { workOrderId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();

  if (!body.templateId) return NextResponse.json({ error: "templateId required" }, { status: 400 });
  const tpl = await db.documentTemplate.findFirst({
    where: { id: body.templateId, OR: [{ tenantId: s.tenantId }, { tenantId: null }] },
  });
  if (!tpl) return NextResponse.json({ error: "Template non trovato" }, { status: 404 });

  // load related entities
  const [tenant, customer, plant, workOrder, technician] = await Promise.all([
    db.tenant.findUnique({ where: { id: s.tenantId } }),
    body.customerId ? db.customer.findFirst({ where: { id: body.customerId, tenantId: s.tenantId } }) : null,
    body.plantId ? db.plant.findFirst({ where: { id: body.plantId, tenantId: s.tenantId } }) : null,
    body.workOrderId ? db.workOrder.findFirst({ where: { id: body.workOrderId, tenantId: s.tenantId } }) : null,
    body.technicianId ? db.user.findFirst({ where: { id: body.technicianId, tenantId: s.tenantId } }) : db.user.findUnique({ where: { id: s.id } }),
  ]);

  // generate code
  const year = new Date().getFullYear();
  const last = await db.amperaDocument.findFirst({
    where: { tenantId: s.tenantId, code: { startsWith: `DOC-${year}-` } },
    orderBy: { createdAt: "desc" }, select: { code: true },
  });
  const n = last ? parseInt(last.code.split("-").pop() || "0") + 1 : 1;
  const code = `DOC-${year}-${String(n).padStart(5, "0")}`;

  // render
  const rendered = renderTemplate(tpl.bodyTemplate, {
    tenant: tenant || {},
    customer: customer || {},
    plant: plant || null,
    workOrder: workOrder || null,
    technician,
    user: technician,
    doc: { code, title: tpl.title } as any,
    custom: body.customFields || {},
  });

  const doc = await db.amperaDocument.create({
    data: {
      tenantId: s.tenantId,
      templateId: tpl.id,
      code,
      title: body.title || tpl.title,
      category: tpl.category,
      customerId: body.customerId || null,
      plantId: body.plantId || null,
      workOrderId: body.workOrderId || null,
      reportId: body.reportId || null,
      projectId: body.projectId || null,
      contentHtml: rendered,
      status: "READY",
      generatedAt: new Date(),
      customFieldsJson: body.customFields ? JSON.stringify(body.customFields) : null,
      createdById: s.id,
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "AmperaDocument", entityId: doc.id });
  return NextResponse.json({ document: doc }, { status: 201 });
}
