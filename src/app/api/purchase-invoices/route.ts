import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const invoices = await db.purchaseInvoice.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    include: { lines: true, _count: { select: { lines: true } } },
    orderBy: { issueDate: "desc" },
    take: 200,
  });
  // Join supplier
  const supplierIds = [...new Set(invoices.map(i => i.supplierId))];
  const suppliers = await db.supplier.findMany({ where: { id: { in: supplierIds } }, select: { id: true, name: true } });
  const supMap = new Map(suppliers.map(s => [s.id, s.name]));
  return NextResponse.json({ invoices: invoices.map(i => ({ ...i, supplierName: supMap.get(i.supplierId) })) });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  if (!body.supplierId) return NextResponse.json({ error: "Fornitore obbligatorio" }, { status: 400 });
  if (!body.number) return NextResponse.json({ error: "Numero fattura obbligatorio" }, { status: 400 });

  const lines = (body.lines || []).map((l: any, i: number) => {
    const gross = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0);
    const discounted = gross * (1 - (Number(l.discountPercent) || 0) / 100);
    return {
      position: i + 1,
      type: l.type || "WAREHOUSE",
      materialId: l.materialId || null,
      materialCode: l.materialCode || null,
      description: l.description,
      lineNote: l.lineNote || null,
      quantity: Number(l.quantity), unit: l.unit || "pz",
      unitPrice: Number(l.unitPrice),
      discountPercent: Number(l.discountPercent || 0),
      vatRate: Number(l.vatRate || 22),
      total: discounted * (1 + (Number(l.vatRate || 22)) / 100),
      warehouseId: l.warehouseId || null,
      assetId: l.assetId || null,
      amortizationYears: Number(l.amortizationYears || 5),
    };
  });
  const subtotal = lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const vatTotal = lines.reduce((s: number, l: any) => s + l.quantity * l.unitPrice * (1 - l.discountPercent / 100) * (l.vatRate / 100), 0);
  const shippingCost = Number(body.shippingCost || 0);
  const withholdingTax = Number(body.withholdingTax || 0);
  const total = subtotal + vatTotal + shippingCost - withholdingTax;

  const result = await db.$transaction(async (tx) => {
    const inv = await tx.purchaseInvoice.create({
      data: {
        tenantId: s.tenantId, supplierId: body.supplierId,
        number: body.number, series: body.series,
        issueDate: new Date(body.issueDate || Date.now()),
        receiveDate: body.receiveDate ? new Date(body.receiveDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        notes: body.notes, internalNotes: body.internalNotes,
        purchaseOrderId: body.purchaseOrderId,
        reverseCharge: !!body.reverseCharge,
        subtotal, vatTotal, shippingCost, total, withholdingTax,
        registeredById: s.id,
        lines: { create: lines },
      },
      include: { lines: true },
    });

    // Process each line: WAREHOUSE -> StockMovement IN; ASSET -> AssetAcquisition
    for (const line of inv.lines) {
      if (line.type === "WAREHOUSE" && line.warehouseId) {
        // Resolve materialId by code if not provided
        let materialId = line.materialId;
        if (!materialId && line.materialCode) {
          const m = await tx.material.findFirst({ where: { tenantId: s.tenantId, code: line.materialCode } });
          if (m) materialId = m.id;
        }
        if (materialId) {
          const sm = await tx.stockMovement.create({
            data: {
              tenantId: s.tenantId, materialId, warehouseId: line.warehouseId,
              type: "IN", quantity: line.quantity, unitPrice: line.unitPrice,
              reference: `INV-${inv.number}`, userId: s.id,
              notes: `Carico da fattura acquisto ${inv.number}`,
            },
          });
          await tx.purchaseInvoiceLine.update({ where: { id: line.id }, data: { stockMovementId: sm.id, materialId } });
        }
      } else if (line.type === "ASSET") {
        // Create AssetAcquisition record
        const last = await tx.assetAcquisition.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" } });
        const n = last ? parseInt((last.code || "0").replace(/\D/g, "")) + 1 : 1;
        const code = `CESP-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
        const asset = await tx.assetAcquisition.create({
          data: {
            tenantId: s.tenantId, code,
            name: line.description,
            category: "Acquisto da fattura",
            acquisitionDate: inv.issueDate,
            purchasePrice: line.quantity * line.unitPrice,
            vatRate: line.vatRate,
            amortizationYears: line.amortizationYears,
            supplierId: inv.supplierId,
            invoiceRef: `${inv.number}/${inv.series || ""}`,
            notes: `Generato automaticamente da fattura acquisto ${inv.number}`,
          },
        });
        await tx.purchaseInvoiceLine.update({ where: { id: line.id }, data: { assetId: asset.id } });
      }
    }

    return inv;
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "PurchaseInvoice", entityId: result.id });
  return NextResponse.json({ invoice: result }, { status: 201 });
}
