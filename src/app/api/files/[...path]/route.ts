import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readStoredFile, mimeOf } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const { path } = await params;
  if (!path?.length) return new NextResponse("Bad request", { status: 400 });
  const tenantId = path[0];
  if ((session.user as any).tenantId !== tenantId && !(session.user as any).isSuperAdmin) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  try {
    const buf = await readStoredFile(path.join("/"));
    const name = path[path.length - 1];
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mimeOf(name),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e) {
    return new NextResponse("Not found", { status: 404 });
  }
}
