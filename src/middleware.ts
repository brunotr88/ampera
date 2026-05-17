import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api/health|api/auth|api/files|api/cron|_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*|.*\\.svg|.*\\.png).*)"],
};
