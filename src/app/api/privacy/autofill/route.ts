/**
 * Auto-fill subject data from a customer, supplier, or user entity.
 * Returns pre-populated subject fields ready to be passed to template generator.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const subjectType = req.nextUrl.searchParams.get("subjectType");
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectType || !subjectId) return NextResponse.json({ error: "subjectType + subjectId required" }, { status: 400 });

  if (subjectType === "customer") {
    const c = await db.customer.findFirst({
      where: { id: subjectId, tenantId: s.tenantId, deletedAt: null },
      include: { addresses: { where: { isDefault: true }, take: 1 } },
    });
    if (!c) return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
    const addr = c.addresses[0];
    return NextResponse.json({
      subject: {
        name: c.name,
        surname: c.surname,
        companyName: c.companyName,
        fiscalCode: c.fiscalCode,
        vatNumber: c.vatNumber,
        email: c.email,
        phone: c.phone || c.mobile,
        address: addr?.street,
        city: addr?.city,
      },
      customerId: c.id,
    });
  }

  if (subjectType === "supplier") {
    const sup = await db.supplier.findFirst({ where: { id: subjectId, tenantId: s.tenantId, deletedAt: null } });
    if (!sup) return NextResponse.json({ error: "Fornitore non trovato" }, { status: 404 });
    return NextResponse.json({
      subject: {
        name: sup.contactName || sup.name,
        companyName: sup.name,
        fiscalCode: sup.fiscalCode,
        vatNumber: sup.vatNumber,
        email: sup.email,
        phone: sup.phone,
        address: sup.address,
        city: sup.city,
      },
      supplierId: sup.id,
    });
  }

  if (subjectType === "user") {
    const u = await db.user.findFirst({ where: { id: subjectId, tenantId: s.tenantId, active: true } });
    if (!u) return NextResponse.json({ error: "Utente non trovato" }, { status: 404 });
    return NextResponse.json({
      subject: {
        name: u.name.split(" ")[0],
        surname: u.name.split(" ").slice(1).join(" "),
        email: u.email,
        phone: u.phoneNumber,
        role: u.role,
      },
      userId: u.id,
    });
  }

  return NextResponse.json({ error: "subjectType invalid" }, { status: 400 });
}
