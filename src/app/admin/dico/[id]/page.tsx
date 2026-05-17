import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatDate } from "@/lib/utils";
import { Printer, CheckCircle2, AlertCircle } from "lucide-react";

export default async function DicoDetail({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const d = await db.conformityDeclaration.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { plant: { include: { customer: true } } },
  });
  if (!d) return notFound();

  const checklist = (d.checklistJson as Record<string, boolean>) || {};
  const allChecked = Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div className="space-y-6">
      <PageHeader title={`DICO ${d.number}`} description={`${d.plant.name} · ${d.plant.customer.companyName || d.plant.customer.name}`} back="/admin/dico" />

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Stato</CardTitle></CardHeader><CardContent>
          <Badge variant={d.status === "ISSUED" ? "success" : "warning"}>{d.status}</Badge>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Emissione</CardTitle></CardHeader><CardContent>
          <div className="font-display text-2xl font-bold">{d.issueDate ? formatDate(d.issueDate) : "—"}</div>
        </CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Completezza</CardTitle></CardHeader><CardContent>
          <div className={`font-display text-2xl font-bold ${allChecked ? "text-emerald-600" : "text-amber-600"}`}>
            {checkedCount}/{totalCount}
          </div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Responsabile Tecnico</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div><strong>Nome:</strong> {d.rtName || "—"}</div>
          <div><strong>Iscrizione CCIAA:</strong> {d.rtRegistrationNo || "—"}</div>
          {d.notes && <div className="pt-2 border-t"><strong>Note:</strong><br/>{d.notes}</div>}
        </CardContent>
      </Card>

      {Object.keys(checklist).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">{allChecked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />} Checklist conformità</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {Object.entries(checklist).map(([k, v]) => (
                <li key={k} className="flex items-center gap-2">
                  {v ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/40 inline-block" />}
                  <span className={v ? "" : "text-muted-foreground"}>{k}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Attachments entityType="ConformityDeclaration" entityId={d.id} title="Allegati DICO (progetto, schemi, certificati)" accept=".pdf,image/*,.dwg" />
    </div>
  );
}
