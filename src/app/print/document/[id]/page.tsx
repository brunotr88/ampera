import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";

export default async function PrintDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const doc = await db.amperaDocument.findFirst({ where: { id, tenantId: s.tenantId, deletedAt: null } });
  if (!doc) return notFound();

  return (
    <html>
      <head>
        <title>{doc.title} - {doc.code}</title>
        <style>{`
          @page { size: A4; margin: 18mm; }
          body { font-family: 'Inter', Arial, sans-serif; color: #111; line-height: 1.55; font-size: 14px; }
          .signature-block { margin-top: 50px; page-break-inside: avoid; }
          .signature-img { max-width: 280px; max-height: 100px; border-bottom: 1px solid #000; }
        `}</style>
      </head>
      <body>
        <div dangerouslySetInnerHTML={{ __html: doc.contentHtml }} />
        {doc.signedAt && doc.signatureDataUrl && (
          <div className="signature-block">
            <p><strong>Firmato digitalmente da:</strong> {doc.signedByName}</p>
            <img src={doc.signatureDataUrl} alt="firma" className="signature-img" />
            <p style={{ fontSize: 11, color: "#555" }}>
              Modalità: {doc.signatureType} · Data/ora: {new Date(doc.signedAt).toLocaleString("it-IT")}
            </p>
          </div>
        )}
        {doc.signedAt && !doc.signatureDataUrl && (
          <div className="signature-block">
            <p><strong>Firmato:</strong> {doc.signedByName} ({doc.signatureType})</p>
            <p style={{ fontSize: 11 }}>Data: {new Date(doc.signedAt).toLocaleString("it-IT")}</p>
          </div>
        )}
        <script dangerouslySetInnerHTML={{ __html: `if (location.search.includes('print=1')) setTimeout(() => window.print(), 500);` }} />
      </body>
    </html>
  );
}
