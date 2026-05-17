import { auth } from "./auth";
import { db } from "./db";
import type { Role } from "@prisma/client";

const ROLE_RANK: Record<string, number> = {
  CUSTOMER: 0,
  VIEWER: 1,
  TECHNICIAN: 2,
  OFFICE: 3,
  ADMIN: 4,
  OWNER: 5,
};

export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const u = session.user as any;
  if (!u.tenantId && !u.isSuperAdmin) throw new Error("NO_TENANT");
  return {
    id: u.id as string,
    email: u.email as string,
    name: u.name as string,
    role: u.role as Role,
    tenantId: u.tenantId as string,
    isSuperAdmin: !!u.isSuperAdmin,
  };
}

export async function requireRole(min: Role) {
  const s = await requireSession();
  if (!hasRole(s.role, min)) throw new Error("FORBIDDEN");
  return s;
}

export function hasRole(actual: Role | string, min: Role | string): boolean {
  return (ROLE_RANK[actual] ?? -1) >= (ROLE_RANK[min] ?? 999);
}

export function isAdminOrOwner(role: Role | string) {
  return role === "OWNER" || role === "ADMIN";
}

export async function tenantScope<T extends { tenantId: string }>(extra?: T): Promise<{ tenantId: string }> {
  const s = await requireSession();
  return { tenantId: s.tenantId, ...(extra || {}) };
}

export async function getCurrentTenant() {
  const s = await requireSession();
  return db.tenant.findUnique({ where: { id: s.tenantId } });
}
