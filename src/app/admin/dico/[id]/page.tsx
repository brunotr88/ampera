import Link from "next/link";
import { t } from "@/lib/labels";
import { notFound } from "next/navigation";
import { requireSession, hasRole } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Attachments } from "@/components/app/attachments";
import { formatDate } from "@/lib/utils";
import { Printer, CheckCircle2, AlertCircle, Edit } from "lucide-react";
import { DicoEditForm } from "./edit-form";

export default async function DicoDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const sp = await searchParams;
  const d = await db.conformityDeclaration.findFirst({
    where: { id, tenantId: s.tenantId },
    include: { plant: { include: { customer: true } } },
  });
  if (!d) return notFound();

  const canEdit = hasRole(s.role, "ADMIN") || hasRole(s.role, "OWNER") || s.role === "OFFICE";
  const editing = sp?.edit === "1" && canEdit;

  const checklist = (d.checklistJson as Record<string, boolean>) || {};
  const allChecked = Object.keys(checklist).length > 0 && Object.values(checklist).every(Boolean);
  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;

  return (
    <div className="space-y-6">
      <PageHeader title={`DICO ${d.number}`} description={`${d.plant.name} · ${d.plant.customer.companyName || d.plant.customer.name}`} back="/admin/dico"
        actions={
          <div className="flex gap-2">
            {canEdit && !editing && <Button asChild variant="outline"><Link href={`/admin/dico/${d.id}?edit=1`}><Edit className="h-4 w-4" /> Modifica</Link></Button>}
            <Button asChild variant="outline"><Link href={`/print/dico/${d.id}?print=1`} target="_blank"><Printer className="h-4 w-4" /> Stampa</Link></Button>
          </div>
        } />

      {editing ? <DicoEditForm dico={JSON.parse(JSON.stringify(d))} /> : (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Stato</CardTitle></CardHeader><CardContent>
              <Badge variant={d.status === "ISSUED" ? "success" : d.status === "SENT_TO_INAIL" ? "info" : "warning"}>{t(d.status)}</Badge>
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
              {d.sentToInailAt && <div><strong>Inviata INAIL:</strong> {formatDate(d.sentToInailAt)} {d.inailReceipt && `(prot. ${d.inailReceipt})`}</div>}
              {d.notes && <div className="pt-2 border-t"><strong>Note:</strong><br/>{d.notes}</div>}
            </CardContent>
          </Card>

          {Object.keys(checklist).length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2">{allChecked ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4 text-amber-500" />} Checklist conformita</CardTitle></CardHeader>
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
        </>
      )}
    </div>
  );
}
