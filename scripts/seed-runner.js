const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const tenantName = process.env.ADMIN_TENANT_NAME || "Default Tenant";
  const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "CHANGE_ME";
  const name = process.env.ADMIN_NAME || "Admin";

  // Tenant
  let tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug,
        email,
        plan: "ENTERPRISE",
        active: true,
        defaultVat: 22,
        defaultMargin: 30,
      },
    });
    console.log(`[seed] Tenant created: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`[seed] Tenant already exists: ${tenant.name}`);
  }

  // Admin user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: "OWNER",
        tenantId: tenant.id,
        active: true,
        isSuperAdmin: true,
      },
    });
    console.log(`[seed] Admin user created: ${user.email}`);
  } else {
    console.log(`[seed] Admin user already exists: ${existing.email}`);
    if (!existing.tenantId) {
      await prisma.user.update({ where: { id: existing.id }, data: { tenantId: tenant.id, role: "OWNER", isSuperAdmin: true } });
      console.log(`[seed] Linked admin to tenant`);
    }
  }

  // Default warehouse HQ
  const hq = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id, type: "HQ" } });
  if (!hq) {
    await prisma.warehouse.create({
      data: { tenantId: tenant.id, name: "Magazzino Sede", type: "HQ", active: true },
    });
    console.log(`[seed] HQ warehouse created`);
  }

  console.log("[seed] Done.");
}

main()
  .catch((e) => { console.error("[seed] error", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
