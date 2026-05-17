import Link from "next/link";
import { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { PageHelp, type PageHelpData } from "./page-help";

export function PageHeader({ title, description, actions, back, help }: { title: string; description?: string; actions?: ReactNode; back?: string; help?: PageHelpData }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
      <div>
        {back && (
          <Link href={back} className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-2">
            <ChevronLeft className="h-3 w-3" /> Indietro
          </Link>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
          {help && <PageHelp data={help} />}
        </div>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
