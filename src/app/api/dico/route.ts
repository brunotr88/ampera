import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const dicos = await db.conformityDeclaration.findMany({
    where: { tenantId: s.tenantId },
    include: { plant: { include: { customer: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ dicos });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  if (!body.plantId) return NextResponse.json({ error: "plantId required" }, { status: 400 });

  const plant = await db.plant.findFirst({ where: { id: body.plantId, tenantId: s.tenantId } });
  if (!plant) return NextResponse.json({ error: "Plant not found" }, { status: 404 });

  const last = await db.conformityDeclaration.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" } });
  const n = last ? parseInt((last.number || "0").replace(/\D/g, "")) + 1 : 1;
  const number = `DICO-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;

  const d = await db.conformityDeclaration.create({
    data: {
      tenantId: s.tenantId,
      customerId: plant.customerId,
      plantId: body.plantId,
      number,
      rtName: body.rtName,
      rtRegistrationNo: body.rtRegistrationNo,
      generatedFromAi: !!body.generatedFromAi,
      issueDate: body.issueDate ? new Date(body.issueDate) : null,
      checklistJson: body.checklist || null,
      attachmentsJson: body.attachments || null,
      notes: body.notes,
      status: "DRAFT",
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "ConformityDeclaration", entityId: d.id });
  return NextResponse.json({ dico: d }, { status: 201 });
}
