import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) return NextResponse.json({});
  const t = s.tenantId;

  const [customers, plants, reports, materials, invoices, quotes, workOrders] = await Promise.all([
    db.customer.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { name: { contains: q, mode: "insensitive" } },
        { surname: { contains: q, mode: "insensitive" } },
        { companyName: { contains: q, mode: "insensitive" } },
        { vatNumber: { contains: q, mode: "insensitive" } },
        { fiscalCode: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
      ] },
      take: 8, orderBy: { updatedAt: "desc" },
    }),
    db.plant.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
      ] },
      include: { customer: { select: { name: true, surname: true, companyName: true } } },
      take: 6, orderBy: { updatedAt: "desc" },
    }),
    db.report.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { code: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ] },
      include: { customer: { select: { name: true, surname: true, companyName: true } } },
      take: 6, orderBy: { updatedAt: "desc" },
    }),
    db.material.findMany({
      where: { tenantId: t, deletedAt: null, active: true, OR: [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { metelCode: { contains: q, mode: "insensitive" } },
        { brand: { contains: q, mode: "insensitive" } },
      ] },
      take: 6,
    }),
    db.invoice.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { number: { contains: q } },
      ] },
      take: 5,
    }),
    db.quote.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { number: { contains: q } },
        { title: { contains: q, mode: "insensitive" } },
      ] },
      take: 5,
    }),
    db.workOrder.findMany({
      where: { tenantId: t, deletedAt: null, OR: [
        { code: { contains: q, mode: "insensitive" } },
        { title: { contains: q, mode: "insensitive" } },
      ] },
      take: 5,
    }),
  ]);

  return NextResponse.json({ customers, plants, reports, materials, invoices, quotes, workOrders });
}
