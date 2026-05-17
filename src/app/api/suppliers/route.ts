import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireSession();
  const suppliers = await db.supplier.findMany({ where: { tenantId: s.tenantId, deletedAt: null, active: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ suppliers });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const supplier = await db.supplier.create({
    data: {
      tenantId: s.tenantId,
      name: body.name, vatNumber: body.vatNumber, fiscalCode: body.fiscalCode,
      email: body.email, phone: body.phone, address: body.address, city: body.city,
      province: body.province, zip: body.zip, contactName: body.contactName,
      paymentTerms: body.paymentTerms, notes: body.notes,
    },
  });
  return NextResponse.json({ supplier }, { status: 201 });
}
