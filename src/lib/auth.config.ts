import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as any)?.role;
      const { pathname } = nextUrl;
      // Public
      if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/health") || pathname === "/login" || pathname.startsWith("/_next") || pathname === "/" || pathname.startsWith("/q/") || pathname.startsWith("/share/")) {
        return true;
      }
      // Cron endpoints have their own Bearer auth
      if (pathname.startsWith("/api/cron")) {
        return true;
      }
      // TECHNICIAN puro: NO accesso a /admin (reindirizza a /operatore)
      if (isLoggedIn && role === "TECHNICIAN" && pathname.startsWith("/admin")) {
        const redirectUrl = new URL("/operatore", nextUrl);
        return Response.redirect(redirectUrl) as any;
      }
      // VIEWER: read-only, blocca /operatore (loro non hanno cantiere)
      if (isLoggedIn && role === "VIEWER" && pathname.startsWith("/operatore")) {
        const redirectUrl = new URL("/admin", nextUrl);
        return Response.redirect(redirectUrl) as any;
      }
      // CUSTOMER: solo portale cliente (in arrivo)
      if (isLoggedIn && role === "CUSTOMER" && (pathname.startsWith("/admin") || pathname.startsWith("/operatore"))) {
        const redirectUrl = new URL("/login", nextUrl);
        return Response.redirect(redirectUrl) as any;
      }
      // Otherwise: protected
      if (pathname.startsWith("/admin") || pathname.startsWith("/operatore") || pathname.startsWith("/app") || pathname.startsWith("/api")) {
        return isLoggedIn;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.name = (user as any).name;
        token.email = (user as any).email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).tenantId = token.tenantId as string | null;
        (session.user as any).isSuperAdmin = token.isSuperAdmin as boolean;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
