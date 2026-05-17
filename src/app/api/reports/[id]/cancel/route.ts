/**
 * Cancel a recently submitted report (within 10 minutes of signing).
 * After 10 min the report becomes immutable and cannot be cancelled.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

const CANCEL_WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = body.reason || "Annullato dall'operatore";

  const r = await db.report.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only owner or admin or the report technician can cancel
  if (r.technicianId !== s.id && !["ADMIN", "OWNER"].includes(s.role as string)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (r.cancelledAt) return NextResponse.json({ error: "Già annullato" }, { status: 400 });
  if (r.notifiedAt) return NextResponse.json({ error: "Già inviato/notificato - non più annullabile" }, { status: 423 });

  const signedAt = r.signedAt || r.createdAt;
  const elapsed = Date.now() - new Date(signedAt).getTime();
  if (elapsed > CANCEL_WINDOW_MS && !["ADMIN", "OWNER"].includes(s.role as string)) {
    return NextResponse.json({ error: "Finestra di annullamento (10 min) scaduta" }, { status: 410 });
  }

  // Restore stock movements if any
  const used = await db.materialUsed.findMany({ where: { reportId: id } });
  for (const u of used) {
    if (u.materialId && u.warehouseId) {
      await db.stockMovement.create({
        data: {
          tenantId: s.tenantId, materialId: u.materialId, warehouseId: u.warehouseId,
          type: "RETURN", quantity: u.quantity, unitPrice: u.unitPrice,
          reference: `CANCEL-${r.code}`, userId: s.id,
          notes: `Storno per annullamento rapportino ${r.code}: ${reason}`,
        },
      });
    }
  }

  await db.report.update({
    where: { id },
    data: { cancelledAt: new Date(), cancelReason: reason, status: "DRAFT", immutable: false },
  });

  // Restore WorkOrder status if linked
  if (r.workOrderId) {
    await db.workOrder.update({ where: { id: r.workOrderId }, data: { status: "SCHEDULED", endedAt: null } });
  }

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "REPORT_CANCEL", entity: "Report", entityId: id, meta: { reason } });
  return NextResponse.json({ ok: true });
}
