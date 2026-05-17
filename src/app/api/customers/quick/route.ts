/**
 * Quick-create customer endpoint per operatore.
 * Solo nome + telefono + indirizzo minimi. Tipo PRIVATE per default.
 * Validazione minima per non bloccare l'operatore in cantiere.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const body = await req.json();
  const name = (body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });

  const isBusiness = !!body.companyName;
  const customer = await db.customer.create({
    data: {
      tenantId: s.tenantId,
      type: isBusiness ? "BUSINESS" : "PRIVATE",
      name: isBusiness ? (body.companyName || name) : name,
      surname: body.surname,
      companyName: body.companyName,
      vatNumber: body.vatNumber,
      fiscalCode: body.fiscalCode,
      email: body.email,
      phone: body.phone,
      mobile: body.mobile,
      notes: body.notes,
      status: "ACTIVE",
      gdprConsent: !!body.gdprConsent,
      gdprConsentAt: body.gdprConsent ? new Date() : null,
    },
  });

  if (body.address) {
    await db.address.create({
      data: {
        customerId: customer.id, type: "MAIN",
        street: body.address.street || body.address,
        city: body.address.city || "",
        province: body.address.province,
        zip: body.address.zip,
        isDefault: true,
      },
    });
  }

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: "QUICK_CREATE", entity: "Customer", entityId: customer.id });
  return NextResponse.json({ customer }, { status: 201 });
}
