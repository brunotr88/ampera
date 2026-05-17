import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";
import { INCENTIVES } from "@/lib/incentives";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const apps = await db.incentiveApplication.findMany({
    where: { tenantId: s.tenantId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications: apps, definitions: INCENTIVES });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const def = INCENTIVES.find(i => i.type === body.type);
  if (!def) return NextResponse.json({ error: "Tipo agevolazione non valido" }, { status: 400 });

  const last = await db.incentiveApplication.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" }, select: { code: true } });
  const n = last ? parseInt((last.code || "0").replace(/\D/g, "")) + 1 : 1;
  const code = `AG-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;

  const totalAmount = Number(body.totalAmount || 0);
  const deductiblePercentage = def.percentage;
  const cappedAmount = def.maxAmount ? Math.min(totalAmount, def.maxAmount) : totalAmount;
  const deductibleAmount = (cappedAmount * deductiblePercentage) / 100;
  const yearlyAmount = deductibleAmount / def.yearsRecovery;

  const app = await db.incentiveApplication.create({
    data: {
      tenantId: s.tenantId, code, type: body.type as any,
      customerId: body.customerId, plantId: body.plantId, projectId: body.projectId, invoiceId: body.invoiceId,
      workDescription: body.workDescription || "",
      workStartDate: body.workStartDate ? new Date(body.workStartDate) : null,
      workEndDate: body.workEndDate ? new Date(body.workEndDate) : null,
      totalAmount, deductiblePercentage, deductibleAmount, yearlyAmount,
      yearsOfRecovery: def.yearsRecovery,
      cessionAccredito: !!body.cessionAccredito,
      sconfoFattura: !!body.sconfoFattura,
      technicalAsseveration: !!body.technicalAsseveration,
      bankTransferRef: body.bankTransferRef, bankTransferDate: body.bankTransferDate ? new Date(body.bankTransferDate) : null,
      bankTransferDescription: body.bankTransferDescription,
      notes: body.notes,
      metadata: { defLabel: def.label, defNormative: def.normative },
    },
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "IncentiveApplication", entityId: app.id, meta: { type: body.type } });
  return NextResponse.json({ application: app }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const app = await db.incentiveApplication.findFirst({ where: { id: body.id, tenantId: s.tenantId } });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const upd = await db.incentiveApplication.update({ where: { id: body.id }, data: {
    status: body.status, bankTransferRef: body.bankTransferRef,
    bankTransferDate: body.bankTransferDate ? new Date(body.bankTransferDate) : undefined,
    enéaProtocol: body.enéaProtocol, enéaSubmittedAt: body.enéaSubmittedAt ? new Date(body.enéaSubmittedAt) : undefined,
    agenciaProtocol: body.agenciaProtocol, notes: body.notes,
  } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "UPDATE", entity: "IncentiveApplication", entityId: body.id });
  return NextResponse.json({ application: upd });
}
