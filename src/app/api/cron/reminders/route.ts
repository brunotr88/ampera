import { NextRequest, NextResponse } from "next/server";
import { processDueReminders, processMaintenanceContracts } from "@/lib/notifications";
import { runReportReminders } from "@/lib/report-reminders";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";

function verifyCron(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  try {
    const a = Buffer.from(auth.slice(7));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!verifyCron(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [r1, r2, r3] = await Promise.all([processDueReminders(), processMaintenanceContracts(), runReportReminders()]);
  return NextResponse.json({ reminders: r1, maintenance: r2, reports: r3, at: new Date().toISOString() });
}
