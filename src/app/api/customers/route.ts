import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { CustomerCreate } from "@/lib/validators";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const q = req.nextUrl.searchParams.get("q") || "";
  const status = req.nextUrl.searchParams.get("status");
  const customers = await db.customer.findMany({
    where: {
      tenantId: s.tenantId,
      deletedAt: null,
      ...(status ? { status: status as any } : {}),
      ...(q ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { surname: { contains: q, mode: "insensitive" } },
          { companyName: { contains: q, mode: "insensitive" } },
          { vatNumber: { contains: q, mode: "insensitive" } },
          { fiscalCode: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const parsed = CustomerCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  const created = await db.customer.create({
    data: {
      tenantId: s.tenantId,
      ...data,
      gdprConsentAt: data.gdprConsent ? new Date() : null,
    },
  });
  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "CREATE", entity: "Customer", entityId: created.id });
  return NextResponse.json({ customer: created }, { status: 201 });
}
