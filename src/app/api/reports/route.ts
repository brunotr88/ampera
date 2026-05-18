import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";
import { ReportCreate } from "@/lib/validators";
import { saveDataUrl } from "@/lib/storage";
import { auditLog } from "@/lib/audit";
import { sendEmail, emailLayout } from "@/lib/mailer";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const status = req.nextUrl.searchParams.get("status");
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const reports = await db.report.findMany({
    where: { tenantId: s.tenantId, deletedAt: null, ...(status ? { status: status as any } : {}), ...(mine ? { technicianId: s.id } : {}) },
    include: { customer: true, technician: true, plant: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  const rl = rateLimit(`report:create:${s.id}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await req.json();
  const parsed = ReportCreate.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;

  if (data.clientId) {
    const dup = await db.report.findFirst({ where: { tenantId: s.tenantId, clientId: data.clientId } });
    if (dup) return NextResponse.json({ report: dup, deduplicated: true }, { status: 200 });
  }

  const last = await db.report.findFirst({ where: { tenantId: s.tenantId }, orderBy: { createdAt: "desc" }, select: { code: true } });
  const n = last ? parseInt((last.code || "0").replace(/\D/g, "")) + 1 : 1;
  const code = `R-${new Date().getFullYear()}-${String(n).padStart(5, "0")}`;

  const totalLabor = data.timeEntries.reduce((s, t) => s + t.hours * (t.hourlyRate || 0), 0);
  const totalMaterial = data.materials.reduce((s, m) => s + m.quantity * m.unitPrice, 0);

  const result = await db.$transaction(async (tx) => {
    const report = await tx.report.create({
      data: {
        tenantId: s.tenantId,
        code,
        clientId: data.clientId,
        workOrderId: data.workOrderId,
        customerId: data.customerId,
        siteId: data.siteId,
        plantId: data.plantId,
        projectId: data.projectId,
        technicianId: s.id,
        workType: data.workType,
        cause: data.cause,
        description: data.description,
        recommendations: data.recommendations,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        totalHours: data.totalHours,
        travelKm: data.travelKm,
        startLat: data.startLat, startLon: data.startLon,
        endLat: data.endLat, endLon: data.endLon,
        contactPerson: data.contactPerson,
        contactId: data.contactId,
        signerName: data.signerName,
        signedAt: data.signedAt || (data.signatureDataUrl && data.finalize ? new Date() : null),
        status: data.finalize ? "SUBMITTED" : "DRAFT",
        immutable: data.finalize,
        totalLaborAmount: totalLabor,
        totalMaterialAmount: totalMaterial,
        totalAmount: totalLabor + totalMaterial,
      },
    });

    if (data.signatureDataUrl) {
      try {
        const saved = await saveDataUrl({ dataUrl: data.signatureDataUrl, filename: `${report.code}-sig.png`, tenantId: s.tenantId, folder: "signatures" });
        await tx.report.update({ where: { id: report.id }, data: { signatureDataUrl: saved.url } });
      } catch (e) {
        console.error("Signature save error", e);
      }
    }

    for (const t of data.timeEntries) {
      await tx.timeEntry.create({
        data: {
          reportId: report.id, userId: t.userId, hours: t.hours,
          hourlyRate: t.hourlyRate || 0, amount: t.hours * (t.hourlyRate || 0), notes: t.notes,
        },
      });
    }

    for (const m of data.materials) {
      await tx.materialUsed.create({
        data: {
          reportId: report.id, materialId: m.materialId, code: m.code,
          description: m.description, quantity: m.quantity, unit: m.unit,
          unitPrice: m.unitPrice, total: m.quantity * m.unitPrice,
          warehouseId: m.warehouseId,
        },
      });
      if (data.finalize && m.materialId && m.warehouseId) {
        await tx.stockMovement.create({
          data: {
            tenantId: s.tenantId,
            materialId: m.materialId,
            warehouseId: m.warehouseId,
            type: "OUT",
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            reference: report.code,
            projectId: data.projectId,
            userId: s.id,
            notes: `Scarico automatico rapportino ${report.code}`,
          },
        });
      }
    }

    for (let i = 0; i < data.photosBase64.length; i++) {
      const p = data.photosBase64[i];
      try {
        const saved = await saveDataUrl({ dataUrl: p.dataUrl, filename: `${report.code}-photo-${i + 1}.jpg`, tenantId: s.tenantId, folder: "report-photos" });
        await tx.reportPhoto.create({
          data: {
            reportId: report.id, url: saved.url, label: p.label, lat: p.lat, lon: p.lon,
            takenAt: new Date(), sizeBytes: saved.sizeBytes,
          },
        });
      } catch (e) { console.error("Photo save error", e); }
    }

    if (data.workOrderId) {
      await tx.workOrder.update({ where: { id: data.workOrderId }, data: { status: data.finalize ? "COMPLETED" : "IN_PROGRESS", endedAt: data.endedAt } });
    }

    return report;
  });

  await auditLog({ tenantId: s.tenantId, userId: s.id, action: data.finalize ? "REPORT_SUBMIT" : "REPORT_DRAFT", entity: "Report", entityId: result.id });

  if (data.finalize) {
    const customer = await db.customer.findUnique({ where: { id: data.customerId } });
    if (customer?.email) {
      try {
        await sendEmail({
          to: customer.email,
          subject: `Rapportino ${result.code}`,
          html: emailLayout(
            `Rapportino ${result.code}`,
            `<p>Buongiorno,</p><p>in allegato/visualizzabile online il rapportino dell'intervento effettuato.</p>`,
            `${process.env.APP_URL || ""}/print/report/${result.id}`,
            "Visualizza rapportino"
          ),
        });
        await db.report.update({ where: { id: result.id }, data: { customerEmailSent: true } });
      } catch (e) { console.error("Email send error", e); }
    }
  }

  return NextResponse.json({ report: result }, { status: 201 });
}
