import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BottomNav } from "@/components/app/bottom-nav";

export default async function OperatoreLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/operatore");
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
