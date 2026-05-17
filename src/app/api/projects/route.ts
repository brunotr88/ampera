import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { ProjectCreate } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const projects = await db.project.findMany({ where: { tenantId: s.tenantId, deletedAt: null }, include: { customer: true }, orderBy: { updatedAt: "desc" }, take: 100 });
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = ProjectCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const p = await db.project.create({ data: { tenantId: s.tenantId, ...parsed.data } });
  return NextResponse.json({ project: p }, { status: 201 });
}
