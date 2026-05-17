import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function EmptyState({ icon, title, description, cta, className }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  cta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center py-14 px-6 border border-dashed border-border rounded-xl bg-card", className)}>
      {icon && <div className="h-14 w-14 rounded-full bg-ampera-50 text-ampera-700 flex items-center justify-center mb-4">{icon}</div>}
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}
