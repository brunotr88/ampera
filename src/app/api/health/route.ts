import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return new NextResponse("ok", { status: 200, headers: { "Content-Type": "text/plain" } });
  } catch {
    return new NextResponse("nok", { status: 503, headers: { "Content-Type": "text/plain" } });
  }
}
