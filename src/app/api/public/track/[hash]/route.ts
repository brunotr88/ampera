import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;

  const wo = await db.workOrder.findFirst({
    where: { trackingHash: hash, deletedAt: null },
    select: {
      id: true, code: true, title: true, description: true,
      status: true, priority: true, scheduledDate: true, endedAt: true, customStateId: true,
      customer: { select: { name: true, surname: true, companyName: true } },
      plant: { select: { name: true, code: true } },
      assignedTo: { select: { name: true } },
      tenant: { select: { name: true, logoUrl: true, email: true, phone: true, address: true, city: true } },
      updatedAt: true, createdAt: true,
    },
  });
  if (!wo) return NextResponse.json({ error: "Tracking non valido" }, { status: 404 });

  // Stati workflow del tenant per scope WORKORDER (timeline)
  const tenantOwnerId = await db.workOrder.findFirst({ where: { trackingHash: hash }, select: { tenantId: true } });
  const states = await db.workflowState.findMany({
    where: { tenantId: tenantOwnerId!.tenantId, scope: "WORKORDER", isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, color: true, icon: true, percentage: true, isFinal: true, sortOrder: true },
  });

  // Stato corrente: o customStateId o fallback su mappa status enum → %
  let currentState: any = null;
  let currentPercentage = 0;
  if (wo.customStateId) {
    currentState = states.find(s => s.id === wo.customStateId) || null;
    currentPercentage = currentState?.percentage || 0;
  } else {
    const statusMap: Record<string, number> = {
      SCHEDULED: 10, IN_PROGRESS: 50, PAUSED: 50, COMPLETED: 100, EMERGENCY: 30, CANCELLED: 0,
    };
    currentPercentage = statusMap[wo.status] || 0;
  }

  return NextResponse.json({
    workOrder: { ...wo, currentPercentage, currentStateName: currentState?.name || wo.status, currentStateColor: currentState?.color || "#3B82F6" },
    states,
  });
}
