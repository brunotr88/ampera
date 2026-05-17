import { requireSession } from "@/lib/permissions";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomersTable } from "./table";
import { HELP } from "@/lib/page-help-data";
import { Users, Plus, Mail, Phone } from "lucide-react";

export default async function CustomersPage() {
  const s = await requireSession();
  const customers = await db.customer.findMany({
    where: { tenantId: s.tenantId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { plants: true, projects: true, workOrders: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clienti"
        description={`${customers.length} clienti registrati`}
        help={HELP.customers}
        actions={
          <Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Nuovo cliente</Link></Button>
        }
      />

      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="Nessun cliente"
          description="Aggiungi il primo cliente per iniziare a creare preventivi, impianti e interventi."
          cta={<Button asChild><Link href="/admin/customers/new"><Plus className="h-4 w-4" /> Aggiungi cliente</Link></Button>}
        />
      ) : (
        <CustomersTable data={JSON.parse(JSON.stringify(customers))} />
      )}
    </div>
  );
}
