import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { quoteHtml } from "@/lib/pdf";

export default async function PrintQuote({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const q = await db.quote.findFirst({ where: { id, tenantId: s.tenantId }, include: { customer: true, lines: { orderBy: { position: "asc" } } } });
  if (!q) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  return <div dangerouslySetInnerHTML={{ __html: quoteHtml({ tenant, quote: q, customer: q.customer, lines: q.lines }) }} />;
}
