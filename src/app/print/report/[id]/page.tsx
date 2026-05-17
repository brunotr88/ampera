import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { reportHtml } from "@/lib/pdf";

export default async function PrintReport({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const r = await db.report.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { customer: true, plant: true, site: true, technician: true, timeEntries: { include: { user: true } }, materials: { include: { material: true } }, photos: true },
  });
  if (!r) return notFound();
  const tenant = await db.tenant.findUnique({ where: { id: s.tenantId } });
  const html = reportHtml({ tenant, report: r, customer: r.customer, plant: r.plant, site: r.site, technician: r.technician, timeEntries: r.timeEntries, materials: r.materials, photos: r.photos });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
