import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const assets = await db.assetAcquisition.findMany({
    where: { tenantId: s.tenantId },
    orderBy: { acquisitionDate: "desc" },
  });
  return NextResponse.json({ assets });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const last = await db.assetAcquisition.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" } });
  const n = last ? parseInt((last.code || "0").replace(/\D/g, "")) + 1 : 1;
  const code = body.code || `CESP-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
  const asset = await db.assetAcquisition.create({
    data: {
      tenantId: s.tenantId, code,
      name: body.name, description: body.description,
      category: body.category, serialNumber: body.serialNumber,
      acquisitionDate: new Date(body.acquisitionDate || Date.now()),
      purchasePrice: Number(body.purchasePrice || 0),
      vatRate: Number(body.vatRate || 22),
      amortizationYears: Number(body.amortizationYears || 5),
      amortizationStartDate: body.amortizationStartDate ? new Date(body.amortizationStartDate) : null,
      residualValue: Number(body.residualValue || 0),
      location: body.location, supplierId: body.supplierId,
      invoiceRef: body.invoiceRef, purchaseInvoiceId: body.purchaseInvoiceId || null,
      notes: body.notes,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "AssetAcquisition", entityId: asset.id });
  return NextResponse.json({ asset }, { status: 201 });
}
