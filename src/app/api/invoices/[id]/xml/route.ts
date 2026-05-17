import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { generateInvoiceXml } from "@/lib/sdi";

export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const invoice = await db.invoice.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, lines: { orderBy: { position: "asc" } } } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  const xml = generateInvoiceXml({ tenant, invoice, customer: invoice.customer, lines: invoice.lines });
  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Content-Disposition": `attachment; filename="IT${tenant?.vatNumber || "00000000000"}_${invoice.number.replace(/\//g, "_")}.xml"`,
    },
  });
}
