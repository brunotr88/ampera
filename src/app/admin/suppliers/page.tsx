import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/app/page-header";
import { DataTable, type ColumnDef } from "@/components/app/data-table";
import { SupplierForm } from "./supplier-form";
import { parseTableParams, ftsMatchingIds, type SortDir } from "@/lib/datatable";
import type { Prisma } from "@prisma/client";

const SORTABLE = ["name", "vatNumber", "city"];
const FILTERABLE = ["name", "city"];

function buildOrderBy(sort: string, dir: SortDir): Prisma.SupplierOrderByWithRelationInput {
  switch (sort) {
    case "name": return { name: dir };
    case "vatNumber": return { vatNumber: dir };
    case "city": return { city: dir };
    default: return { name: "asc" };
  }
}

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const s = await requireSession();
  const sp = await searchParams;
  const p = parseTableParams(sp, SORTABLE, FILTERABLE);

  const ids = await ftsMatchingIds("Supplier", s.tenantId, p.q);

  const where: Prisma.SupplierWhereInput = {
    tenantId: s.tenantId,
    deletedAt: null,
    ...(ids ? { id: { in: ids } } : {}),
    ...(p.filters.name ? { name: { contains: p.filters.name, mode: "insensitive" } } : {}),
    ...(p.filters.city ? { city: { contains: p.filters.city, mode: "insensitive" } } : {}),
  };

  const [rows, total] = await Promise.all([
    db.supplier.findMany({
      where,
      orderBy: buildOrderBy(p.sort, p.dir),
      skip: (p.page - 1) * p.pageSize,
      take: p.pageSize,
    }),
    db.supplier.count({ where }),
  ]);

  const columns: ColumnDef<typeof rows[number]>[] = [
    { key: "name", label: "Nome", sortable: true, filter: { type: "text", placeholder: "Nome" }, className: "font-medium", render: r => r.name },
    { key: "vatNumber", label: "P.IVA", sortable: true, className: "font-mono text-xs", render: r => r.vatNumber || "—" },
    { key: "contact", label: "Contatti", className: "text-xs", render: r => [r.email, r.phone].filter(Boolean).join(" · ") || "—" },
    { key: "city", label: "Città", sortable: true, filter: { type: "text", placeholder: "Città" }, render: r => r.city || "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Fornitori" description={`${total} fornitori`} back="/admin/purchase-orders" />
      <SupplierForm />
      <DataTable
        basePath="/admin/suppliers"
        columns={columns}
        rows={rows}
        total={total}
        rowKey={r => r.id}
        params={p}
        searchPlaceholder="Cerca fornitore per nome, P.IVA, città…"
      />
    </div>
  );
}
