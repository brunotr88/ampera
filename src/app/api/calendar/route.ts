import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { CalendarEventCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");
  const events = await db.calendarEvent.findMany({
    where: { tenantId: s.tenantId, ...(from && to ? { startsAt: { gte: new Date(from), lte: new Date(to) } } : {}) },
    include: { owner: true },
    orderBy: { startsAt: "asc" },
    take: 500,
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = CalendarEventCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const e = await db.calendarEvent.create({ data: { tenantId: s.tenantId, ownerId: s.id, ...parsed.data } });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "CalendarEvent", entityId: e.id });
  return NextResponse.json({ event: e }, { status: 201 });
}
