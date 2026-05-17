"use client";
import Link from "next/link";
import { t } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { SortableTable, type Column } from "@/components/ui/sortable-table";
import { Mail, Phone } from "lucide-react";

export function CustomersTable({ data }: { data: any[] }) {
  const columns: Column<any>[] = [
    {
      key: "name", header: "Cliente", sortable: true,
      accessor: r => (r.companyName || `${r.name} ${r.surname || ""}`).trim(),
      cell: r => (
        <div>
          <div className="font-medium">{r.companyName || `${r.name} ${r.surname || ""}`.trim()}</div>
          {r.tags?.length > 0 && <div className="flex gap-1 mt-1">{r.tags.slice(0, 3).map((t: string) => <Badge key={t} variant="muted" className="text-[10px]">{t}</Badge>)}</div>}
        </div>
      ),
    },
    { key: "type", header: "Tipo", sortable: true, cell: r => <Badge variant="outline">{t(r.type)}</Badge> },
    { key: "vatNumber", header: "P.IVA / CF", sortable: true, accessor: r => r.vatNumber || r.fiscalCode, cell: r => <span className="font-mono text-xs">{r.vatNumber || r.fiscalCode || "—"}</span> },
    {
      key: "contact", header: "Contatti",
      cell: r => (
        <div className="text-xs space-y-0.5">
          {r.email && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" />{r.email}</div>}
          {r.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{r.phone}</div>}
        </div>
      ),
    },
    { key: "plants", header: "Imp.", sortable: true, align: "right", accessor: r => r._count?.plants || 0 },
    { key: "projects", header: "Comm.", sortable: true, align: "right", accessor: r => r._count?.projects || 0 },
    { key: "status", header: "Stato", sortable: true, cell: r => <Badge variant={r.status === "ACTIVE" ? "success" : r.status === "BLOCKED" ? "destructive" : "muted"}>{t(r.status)}</Badge> },
    { key: "createdAt", header: "Aggiunto", sortable: true, accessor: r => new Date(r.createdAt), cell: r => <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("it-IT")}</span> },
    { key: "id", header: "", cell: r => <Link href={`/admin/customers/${r.id}`} className="text-primary text-xs font-semibold hover:underline">Apri</Link> },
  ];
  return <SortableTable data={data} columns={columns} defaultSortKey="createdAt" defaultSortDir="desc" searchPlaceholder="Cerca cliente, P.IVA, email…" rowHref={r => `/admin/customers/${r.id}`} />;
}
