import { NextRequest, NextResponse } from "next/server";
import { processDueReminders, processMaintenanceContracts } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth || auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [r1, r2] = await Promise.all([processDueReminders(), processMaintenanceContracts()]);
  return NextResponse.json({ reminders: r1, maintenance: r2, at: new Date().toISOString() });
}
