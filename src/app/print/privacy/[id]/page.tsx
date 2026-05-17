import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";

export default async function PrintPrivacy({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return notFound();
  return <div dangerouslySetInnerHTML={{ __html: doc.contentHtml || "<p>Contenuto non disponibile</p>" }} />;
}
