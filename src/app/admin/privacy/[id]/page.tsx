import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default async function PrivacyDoc({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.privacyDocument.findFirst({ where: { id, tenantId: s.tenantId } });
  if (!doc) return notFound();

  return (
    <div className="space-y-4 max-w-3xl">
      <PageHeader title={doc.type.replace(/_/g, " ")} description={`v${doc.version} · ${doc.subjectName || "—"}`} back="/admin/privacy"
        actions={<Button asChild variant="outline"><Link href={`/print/privacy/${doc.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa</Link></Button>}
      />
      <Card><CardContent className="p-6 space-y-3 text-sm">
        <div><strong>Pubblico:</strong> <Badge>{doc.audience}</Badge></div>
        <div><strong>Soggetto:</strong> {doc.subjectName || "—"} ({doc.subjectEmail || "no email"})</div>
        <div><strong>CF:</strong> {doc.subjectFiscalCode || "—"}</div>
        <div><strong>Stato:</strong> {doc.signedAt ? `Firmato il ${formatDateTime(doc.signedAt)}` : doc.revokedAt ? "Revocato" : "Non ancora firmato"}</div>
        {doc.signerName && <div><strong>Firmatario:</strong> {doc.signerName}</div>}
      </CardContent></Card>
      <Card><CardContent className="p-6">
        <h2 className="font-semibold mb-3">Anteprima documento</h2>
        <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto bg-white text-black">
          <div dangerouslySetInnerHTML={{ __html: (doc.contentHtml || "").replace(/<script[^>]*>.*?<\/script>/g, "") }} />
        </div>
      </CardContent></Card>
    </div>
  );
}
