import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { invoiceHtml } from "@/lib/pdf";

export default async function PrintInvoice({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const inv = await db.invoice.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, lines: { orderBy: { position: "asc" } } } });
  if (!inv) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  return <div dangerouslySetInnerHTML={{ __html: invoiceHtml({ tenant, invoice: inv, customer: inv.customer, lines: inv.lines }) }} />;
}
