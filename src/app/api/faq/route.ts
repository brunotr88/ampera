import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, hasRole } from "@/lib/permissions";
import { STATIC_FAQS } from "@/lib/faq-seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await requireSession();
  const audience = (req.nextUrl.searchParams.get("audience") || "ADMIN") as any;
  const q = req.nextUrl.searchParams.get("q") || "";

  const dbFaqs = await db.faq.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ tenantId: s.tenantId }, { isGlobal: true }] },
        { audience },
        q ? { OR: [
          { question: { contains: q, mode: "insensitive" } },
          { answer: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ] } : {},
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  const statics = STATIC_FAQS.filter(f => f.audience === audience).filter(f =>
    !q || f.question.toLowerCase().includes(q.toLowerCase()) || f.answer.toLowerCase().includes(q.toLowerCase()) || f.tags.some(t => t.toLowerCase().includes(q.toLowerCase()))
  );

  return NextResponse.json({ faqs: [...dbFaqs, ...statics] });
}

export async function POST(req: NextRequest) {
  const s = await requireSession();
  if (!hasRole(s.role, "ADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const faq = await db.faq.create({
    data: {
      tenantId: s.tenantId,
      question: body.question,
      answer: body.answer,
      category: body.category,
      audience: body.audience || "ADMIN",
      tags: body.tags || [],
      sortOrder: body.sortOrder || 0,
    },
  });
  return NextResponse.json({ faq }, { status: 201 });
}
