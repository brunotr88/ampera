import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { DEFAULT_WORKFLOW_STATES } from "@/lib/workflow-defaults";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const sp = req.nextUrl.searchParams;
  const scope = sp.get("scope") || undefined;

  // Auto-bootstrap se nessuno stato esiste per il tenant
  const count = await db.workflowState.count({ where: { tenantId: s.tenantId } });
  if (count === 0) {
    await db.workflowState.createMany({
      data: DEFAULT_WORKFLOW_STATES.map(d => ({
        tenantId: s.tenantId,
        scope: d.scope, name: d.name, description: d.description || null,
        color: d.color, icon: d.icon || null, percentage: d.percentage, sortOrder: d.sortOrder,
        isFinal: !!d.isFinal, triggersClientEmail: !!d.triggersClientEmail,
        emailSubject: d.emailSubject || null, emailBodyHtml: d.emailBodyHtml || null,
      })),
      skipDuplicates: true,
    });
  }

  const states = await db.workflowState.findMany({
    where: { tenantId: s.tenantId, ...(scope ? { scope } : {}) },
    orderBy: [{ scope: "asc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json({ states });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  if (!body.name || !body.scope) return NextResponse.json({ error: "name + scope required" }, { status: 400 });

  const state = await db.workflowState.create({
    data: {
      tenantId: s.tenantId,
      scope: body.scope,
      name: body.name,
      description: body.description || null,
      color: body.color || "#3B82F6",
      icon: body.icon || null,
      percentage: Number(body.percentage || 0),
      sortOrder: Number(body.sortOrder || 0),
      isFinal: !!body.isFinal,
      isActive: body.isActive ?? true,
      triggersClientEmail: !!body.triggersClientEmail,
      emailSubject: body.emailSubject || null,
      emailBodyHtml: body.emailBodyHtml || null,
    },
  });
  return NextResponse.json({ state }, { status: 201 });
}
