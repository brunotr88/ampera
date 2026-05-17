/* Demo data seeder for Ampera.
   - 4 users: massimo, giovanna, orietta (ADMIN), andrea (TECHNICIAN)
   - Password for all: Pozzobon2026
   - 15 customers (mix B2C/B2B/condomini)
   - 22 sites, 20 plants
   - 30 work orders (past + future + emergencies)
   - 25 reports (firmati con materiali+ore+foto urls)
   - 8 quotes, 18 invoices, 30 cashbook entries
   - 12 calendar events, 8 DICOs, 6 maintenance contracts
   - 10 purchase orders, 4 suppliers, 35 materials, 4 warehouses

   Idempotente: usa email univoche e codici progressivi. Skip se esistono già.
*/

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(daysBack, daysForward = 0) {
  const range = daysBack + daysForward;
  const d = new Date();
  d.setDate(d.getDate() - daysBack + Math.floor(Math.random() * range));
  d.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
  return d;
}
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d; }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return d; }

const FIRST_NAMES = ["Marco", "Luca", "Giulia", "Anna", "Stefano", "Roberta", "Paolo", "Chiara", "Andrea", "Francesca", "Luigi", "Maria", "Davide", "Sofia", "Riccardo"];
const LAST_NAMES = ["Rossi", "Bianchi", "Verdi", "Esposito", "Romano", "Colombo", "Ferrari", "Marino", "Greco", "Bruno", "Gallo", "Conti", "De Luca", "Mancini", "Costa"];
const COMPANY_SUFFIX = ["SRL", "SpA", "SNC", "& C. SaS"];
const COMPANY_NAMES = ["Edilizia Pozzobon", "Industrial Veneto", "Studio Medico Trevigiano", "Hotel Stella Alpina", "Pasticceria Sole", "Officina Mecca", "Tipografia 2000", "Studio Legale Marchi", "Ristorante La Pergola", "Garage Auto Service", "Lavanderia Express", "Farmacia Centrale", "Boutique Fashion", "Carrozzeria GiBi", "Caseificio Verde Prato"];
const TREVISO_STREETS = ["Via Roma", "Via Treviso", "Viale Trento", "Piazza dei Signori", "Via Calmaggiore", "Via Toniolo", "Via Manin", "Via Sant'Antonino", "Via Cornarotta", "Strada Conca d'Oro"];
const CITIES = [
  { name: "Treviso", prov: "TV", zip: "31100" },
  { name: "Trevignano", prov: "TV", zip: "31040" },
  { name: "Castelfranco Veneto", prov: "TV", zip: "31033" },
  { name: "Conegliano", prov: "TV", zip: "31015" },
  { name: "Vittorio Veneto", prov: "TV", zip: "31029" },
  { name: "Montebelluna", prov: "TV", zip: "31044" },
];

const PLANT_TYPES = ["CIVIL", "INDUSTRIAL", "PHOTOVOLTAIC", "DOMOTIC", "EMERGENCY", "FIRE_ALARM", "HVAC", "CHARGING_STATION"];
const WORK_TYPES = ["Manutenzione", "Guasto", "Nuovo impianto", "Verifica DPR 462", "Adeguamento normativo", "Sopralluogo"];
const MATERIALS_DEMO = [
  { code: "INT4X32", metelCode: "0123456001", name: "Interruttore magnetotermico 4x32A", brand: "ABB", category: "Protezioni", unitPrice: 145.5, vatRate: 22 },
  { code: "INT2X16", metelCode: "0123456002", name: "Interruttore differenziale 2x16A 30mA", brand: "ABB", category: "Protezioni", unitPrice: 89.9, vatRate: 22 },
  { code: "CAVO4MM", metelCode: "0123456003", name: "Cavo FG7 4mm² (al metro)", brand: "Prysmian", category: "Cavi", unitPrice: 2.4, vatRate: 22 },
  { code: "CAVO25", metelCode: "0123456004", name: "Cavo FG7 2.5mm² (al metro)", brand: "Prysmian", category: "Cavi", unitPrice: 1.8, vatRate: 22 },
  { code: "MORSE25", metelCode: "0123456005", name: "Morsetto Wago 2.5mm 4 poli", brand: "Wago", category: "Connessioni", unitPrice: 0.55, vatRate: 22 },
  { code: "PRESA16", metelCode: "0123456006", name: "Presa Schuko 16A bianca", brand: "Bticino", category: "Frutti", unitPrice: 4.2, vatRate: 22 },
  { code: "PUNTOL", metelCode: "0123456007", name: "Punto luce LED 9W bianco caldo", brand: "Osram", category: "Illuminazione", unitPrice: 12.5, vatRate: 22 },
  { code: "QUADR12", metelCode: "0123456008", name: "Quadro elettrico 12 moduli da incasso", brand: "ABB", category: "Quadri", unitPrice: 65, vatRate: 22 },
  { code: "PV300", metelCode: "0123456009", name: "Pannello FV 300W policristallino", brand: "Sunpower", category: "Fotovoltaico", unitPrice: 220, vatRate: 10 },
  { code: "INVFV5K", metelCode: "0123456010", name: "Inverter FV 5kW monofase", brand: "Fronius", category: "Fotovoltaico", unitPrice: 1280, vatRate: 10 },
  { code: "BATT10", metelCode: "0123456011", name: "Batteria accumulo 10 kWh LiFePO4", brand: "BYD", category: "Accumulo", unitPrice: 4500, vatRate: 10 },
  { code: "COLON22", metelCode: "0123456012", name: "Colonnina ricarica 22kW Type 2", brand: "Wallbox", category: "E-mobility", unitPrice: 1100, vatRate: 22 },
  { code: "FAN24", metelCode: "0123456013", name: "Ventilatore industriale 600mm 24V", brand: "Soler & Palau", category: "HVAC", unitPrice: 185, vatRate: 22 },
  { code: "TERMO", metelCode: "0123456014", name: "Termostato wifi smart", brand: "Bticino", category: "Domotica", unitPrice: 78, vatRate: 22 },
  { code: "RFLAM", metelCode: "0123456015", name: "Rivelatore di fiamma indirizzato", brand: "Notifier", category: "Antincendio", unitPrice: 145, vatRate: 22 },
];

async function findOrCreate(model, where, data) {
  let r = await model.findFirst({ where });
  if (r) return r;
  return await model.create({ data });
}

async function main() {
  console.log("=== AMPERA DEMO SEED START ===\n");

  // 1) Tenant
  const tenant = await prisma.tenant.findFirst({ where: { slug: "isipc-impianti" } });
  if (!tenant) {
    console.log("Tenant not found. Run /scripts/seed-runner.js first.");
    process.exit(1);
  }
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);

  // 2) Users
  console.log("\n--- Users ---");
  const userDefs = [
    { email: "massimo@isipc.com", name: "Massimo Pozzobon", role: "ADMIN", isSuperAdmin: false },
    { email: "giovanna@isipc.com", name: "Giovanna Bertin", role: "ADMIN", isSuperAdmin: false },
    { email: "orietta@isipc.com", name: "Orietta Cescon", role: "ADMIN", isSuperAdmin: false },
    { email: "andrea@isipc.com", name: "Andrea Marin", role: "TECHNICIAN", isSuperAdmin: false },
  ];
  const passHash = await bcrypt.hash("Pozzobon2026", 12);
  const users = {};
  for (const u of userDefs) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { ...u, passwordHash: passHash, tenantId: tenant.id, active: true, role: u.role },
      });
      console.log(`  ✓ created ${u.email}`);
    } else {
      // Update password to ensure it's Pozzobon2026
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: passHash, tenantId: tenant.id, role: u.role, name: u.name } });
      console.log(`  ↻ updated ${u.email}`);
    }
    users[u.email.split("@")[0]] = user;
  }
  const admin = await prisma.user.findUnique({ where: { email: "admin@isipc.com" } });
  if (admin) users.admin = admin;

  const techIds = [users.massimo.id, users.giovanna.id, users.orietta.id, users.andrea.id];

  // 3) Materials
  console.log("\n--- Materials ---");
  for (const m of MATERIALS_DEMO) {
    await findOrCreate(prisma.material, { tenantId: tenant.id, code: m.code }, { ...m, tenantId: tenant.id, marginPercent: 30, stockMin: 5, unit: "pz", purchasePrice: m.unitPrice * 0.7 });
  }
  console.log(`  ✓ ${MATERIALS_DEMO.length} materials ready`);

  // 4) Warehouses (HQ + 3 vans for techs)
  console.log("\n--- Warehouses ---");
  let hq = await prisma.warehouse.findFirst({ where: { tenantId: tenant.id, type: "HQ" } });
  if (!hq) hq = await prisma.warehouse.create({ data: { tenantId: tenant.id, name: "Magazzino Sede", type: "HQ", active: true } });
  for (const t of ["massimo", "andrea", "giovanna"]) {
    await findOrCreate(
      prisma.warehouse,
      { tenantId: tenant.id, name: `Furgone ${t.charAt(0).toUpperCase() + t.slice(1)}` },
      { tenantId: tenant.id, name: `Furgone ${t.charAt(0).toUpperCase() + t.slice(1)}`, type: "VAN", assignedToId: users[t].id, active: true }
    );
  }
  console.log(`  ✓ 1 HQ + 3 VAN warehouses`);

  // 5) Suppliers
  console.log("\n--- Suppliers ---");
  const supplierNames = [
    { name: "Sonepar Italia SpA", vatNumber: "01234567890", email: "ordini@sonepar.it", city: "Padova" },
    { name: "Comoli Ferrari & C. SpA", vatNumber: "02345678901", email: "info@comoliferrari.com", city: "Novara" },
    { name: "Rexel Italia SpA", vatNumber: "03456789012", email: "ordini@rexel.it", city: "Milano" },
    { name: "Comet Group SpA", vatNumber: "04567890123", email: "info@comet.it", city: "Como" },
  ];
  for (const s of supplierNames) {
    await findOrCreate(prisma.supplier, { tenantId: tenant.id, vatNumber: s.vatNumber }, { ...s, tenantId: tenant.id, active: true, paymentTerms: "60gg DF" });
  }
  console.log(`  ✓ ${supplierNames.length} suppliers`);

  // 6) Cashboxes
  console.log("\n--- Cashboxes ---");
  await findOrCreate(prisma.cashbox, { tenantId: tenant.id, name: "Cassa contanti" },
    { tenantId: tenant.id, name: "Cassa contanti", type: "CASH", initialBalance: 500, currentBalance: 500 });
  await findOrCreate(prisma.cashbox, { tenantId: tenant.id, name: "Banca BPER" },
    { tenantId: tenant.id, name: "Banca BPER", type: "BANK", initialBalance: 15000, currentBalance: 15000 });
  await findOrCreate(prisma.cashbox, { tenantId: tenant.id, name: "POS Carte" },
    { tenantId: tenant.id, name: "POS Carte", type: "POS", initialBalance: 0, currentBalance: 0 });
  const cashboxes = await prisma.cashbox.findMany({ where: { tenantId: tenant.id } });
  console.log(`  ✓ ${cashboxes.length} cashboxes`);

  // 7) Customers
  console.log("\n--- Customers ---");
  const existingCustomers = await prisma.customer.count({ where: { tenantId: tenant.id } });
  if (existingCustomers >= 10) {
    console.log(`  ↻ ${existingCustomers} already present, skip create`);
  } else {
    for (let i = 0; i < 15; i++) {
      const isBusiness = i % 3 !== 2;
      const isCondo = i % 7 === 0;
      const company = isBusiness ? COMPANY_NAMES[i % COMPANY_NAMES.length] + " " + pick(COMPANY_SUFFIX) : null;
      const fn = pick(FIRST_NAMES);
      const ln = pick(LAST_NAMES);
      const city = pick(CITIES);
      const type = isCondo ? "CONDOMINIUM" : isBusiness ? "BUSINESS" : "PRIVATE";
      const c = await prisma.customer.create({
        data: {
          tenantId: tenant.id,
          type,
          name: isBusiness ? company : fn,
          surname: isBusiness ? null : ln,
          companyName: company,
          vatNumber: isBusiness ? String(Math.floor(10000000000 + Math.random() * 89999999999)) : null,
          fiscalCode: !isBusiness ? `${ln.substring(0, 3).toUpperCase()}${fn.substring(0, 3).toUpperCase()}88P19L219H`.substring(0, 16) : null,
          sdiCode: isBusiness ? Array.from({ length: 7 }, () => Math.floor(Math.random() * 36).toString(36)).join("").toUpperCase() : null,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@email-demo.it`,
          phone: `04${randInt(20, 99)} ${randInt(100000, 999999)}`,
          tags: i % 4 === 0 ? ["VIP"] : i % 5 === 0 ? ["ricorrente"] : [],
          status: "ACTIVE",
          gdprConsent: true,
          gdprConsentAt: daysAgo(randInt(30, 365)),
          defaultDiscountPercent: i % 4 === 0 ? 5 : 0,
        },
      });
      // Add addresses
      await prisma.address.create({
        data: {
          customerId: c.id,
          type: "MAIN",
          street: `${pick(TREVISO_STREETS)} ${randInt(1, 200)}`,
          city: city.name,
          province: city.prov,
          zip: city.zip,
          country: "IT",
          isDefault: true,
        },
      });
      // Add a site for businesses
      if (isBusiness || isCondo) {
        await prisma.site.create({
          data: {
            tenantId: tenant.id,
            customerId: c.id,
            name: `Sede ${city.name}`,
            street: `${pick(TREVISO_STREETS)} ${randInt(1, 200)}`,
            city: city.name,
            province: city.prov,
            zip: city.zip,
            country: "IT",
          },
        });
      }
    }
    console.log(`  ✓ 15 customers + addresses + sites`);
  }
  const customers = await prisma.customer.findMany({ where: { tenantId: tenant.id, deletedAt: null }, include: { sites: true } });

  // 8) Plants
  console.log("\n--- Plants ---");
  const existingPlants = await prisma.plant.count({ where: { tenantId: tenant.id } });
  if (existingPlants >= 15) {
    console.log(`  ↻ ${existingPlants} already present, skip create`);
  } else {
    for (let i = 0; i < 20; i++) {
      const c = pick(customers);
      const type = pick(PLANT_TYPES);
      const installDate = daysAgo(randInt(180, 1800));
      const nextCheck = type === "PHOTOVOLTAIC" || type === "INDUSTRIAL" ? daysAhead(randInt(-30, 365)) : daysAhead(randInt(30, 730));
      await prisma.plant.create({
        data: {
          tenantId: tenant.id,
          customerId: c.id,
          siteId: c.sites[0]?.id || null,
          code: `IMP-${String(i + 1).padStart(3, "0")}`,
          name: `${type === "PHOTOVOLTAIC" ? "Impianto FV" : type === "INDUSTRIAL" ? "Quadro industriale" : type === "DOMOTIC" ? "Domotica" : "Impianto " + (i + 1)} ${pick(["piano 1", "piano 2", "garage", "capannone", "cantina", "ufficio"])}`,
          type,
          installDate,
          lastCheckDate: type === "PHOTOVOLTAIC" || type === "INDUSTRIAL" ? daysAgo(randInt(180, 730)) : null,
          nextCheckDate: nextCheck,
          ratedPowerKw: type === "PHOTOVOLTAIC" ? randInt(3, 20) : type === "INDUSTRIAL" ? randInt(20, 100) : randInt(3, 15),
          voltageV: type === "INDUSTRIAL" ? 400 : 230,
        },
      });
    }
    console.log(`  ✓ 20 plants`);
  }
  const plants = await prisma.plant.findMany({ where: { tenantId: tenant.id, deletedAt: null }, include: { customer: true, site: true } });

  // 9) Work Orders (mix past/current/future)
  console.log("\n--- Work Orders ---");
  const existingWOs = await prisma.workOrder.count({ where: { tenantId: tenant.id } });
  if (existingWOs >= 20) {
    console.log(`  ↻ ${existingWOs} already present, skip create`);
  } else {
    for (let i = 0; i < 30; i++) {
      const plant = pick(plants);
      const status = i < 20 ? "COMPLETED" : i < 26 ? "SCHEDULED" : i < 29 ? "IN_PROGRESS" : "EMERGENCY";
      const techId = techIds[i % techIds.length];
      const sched = i < 20 ? daysAgo(randInt(1, 120)) : i < 28 ? daysAhead(randInt(0, 21)) : new Date();
      await prisma.workOrder.create({
        data: {
          tenantId: tenant.id,
          customerId: plant.customerId,
          siteId: plant.siteId,
          plantId: plant.id,
          assignedToId: techId,
          code: `WO-${String(i + 1).padStart(5, "0")}`,
          title: `${pick(WORK_TYPES)} ${plant.name}`,
          description: `Intervento ${pick(WORK_TYPES).toLowerCase()} sull'impianto ${plant.name} presso ${plant.customer.companyName || plant.customer.name}.`,
          status,
          priority: status === "EMERGENCY" ? "EMERGENCY" : i % 8 === 0 ? "URGENT" : "NORMAL",
          scheduledDate: sched,
          estimatedMinutes: pick([60, 90, 120, 180, 240]),
          type: pick(WORK_TYPES),
          startedAt: status === "COMPLETED" || status === "IN_PROGRESS" ? sched : null,
          endedAt: status === "COMPLETED" ? new Date(sched.getTime() + randInt(60, 240) * 60000) : null,
        },
      });
    }
    console.log(`  ✓ 30 work orders`);
  }
  const workOrders = await prisma.workOrder.findMany({ where: { tenantId: tenant.id, status: "COMPLETED" }, take: 25 });

  // 10) Reports for completed WOs
  console.log("\n--- Reports ---");
  const existingReports = await prisma.report.count({ where: { tenantId: tenant.id } });
  const allMaterials = await prisma.material.findMany({ where: { tenantId: tenant.id } });
  const allWarehouses = await prisma.warehouse.findMany({ where: { tenantId: tenant.id } });
  if (existingReports >= 15) {
    console.log(`  ↻ ${existingReports} already present, skip create`);
  } else {
    let reportSeq = 0;
    for (const wo of workOrders.slice(0, 25)) {
      reportSeq++;
      const hours = randInt(2, 16) / 2;
      const matsUsed = Array.from({ length: randInt(2, 5) }, () => pick(allMaterials));
      const totalLabor = hours * 35;
      const totalMaterial = matsUsed.reduce((s, m) => s + m.unitPrice * randInt(1, 4), 0);
      const totalAmount = totalLabor + totalMaterial;
      const techId = wo.assignedToId || pick(techIds);
      const techWh = allWarehouses.find(w => w.assignedToId === techId) || allWarehouses[0];

      const report = await prisma.report.create({
        data: {
          tenantId: tenant.id,
          workOrderId: wo.id,
          customerId: wo.customerId,
          siteId: wo.siteId,
          plantId: wo.plantId,
          technicianId: techId,
          code: `R-${new Date().getFullYear()}-${String(reportSeq).padStart(5, "0")}`,
          status: "SUBMITTED",
          workType: pick(WORK_TYPES),
          cause: pick(["Usura", "Sovraccarico", "Componente rotto", "Manutenzione programmata", "Adeguamento normativo"]),
          description: `Intervento eseguito secondo programmazione. ${pick(["Verifica funzionalita OK.", "Sostituiti componenti come da rapportino allegato.", "Eseguita pulizia e taratura.", "Cliente soddisfatto. Consegnata documentazione."])}`,
          recommendations: reportSeq % 3 === 0 ? "Si consiglia controllo termografico tra 6 mesi." : null,
          startedAt: wo.startedAt,
          endedAt: wo.endedAt,
          totalHours: hours,
          travelKm: randInt(2, 35),
          contactPerson: `Sig. ${pick(LAST_NAMES)}`,
          signerName: `Sig. ${pick(LAST_NAMES)}`,
          signedAt: wo.endedAt,
          immutable: true,
          totalLaborAmount: totalLabor,
          totalMaterialAmount: totalMaterial,
          totalAmount,
          customerEmailSent: true,
        },
      });
      // Time entries
      await prisma.timeEntry.create({
        data: { reportId: report.id, userId: techId, hours, hourlyRate: 35, amount: totalLabor },
      });
      // Materials used
      for (const m of matsUsed) {
        const qty = randInt(1, 4);
        await prisma.materialUsed.create({
          data: {
            reportId: report.id, materialId: m.id, code: m.code, description: m.name,
            quantity: qty, unit: m.unit, unitPrice: m.unitPrice, total: m.unitPrice * qty,
            warehouseId: techWh.id,
          },
        });
        // Create stock OUT movement
        await prisma.stockMovement.create({
          data: {
            tenantId: tenant.id, materialId: m.id, warehouseId: techWh.id,
            type: "OUT", quantity: qty, unitPrice: m.unitPrice, reference: report.code,
            userId: techId,
          },
        });
      }
    }
    console.log(`  ✓ 25 reports + materials + stock movements`);
  }

  // 11) Quotes
  console.log("\n--- Quotes ---");
  const existingQuotes = await prisma.quote.count({ where: { tenantId: tenant.id } });
  if (existingQuotes >= 5) {
    console.log(`  ↻ ${existingQuotes} already present, skip create`);
  } else {
    const year = new Date().getFullYear();
    for (let i = 0; i < 8; i++) {
      const c = pick(customers);
      const status = pick(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED", "EXPIRED"]);
      const lines = Array.from({ length: randInt(3, 7) }, () => {
        const m = pick(allMaterials);
        const qty = randInt(1, 10);
        return { description: m.name, code: m.code, quantity: qty, unit: m.unit, unitPrice: m.unitPrice, discountPercent: 0, vatRate: m.vatRate, total: qty * m.unitPrice * (1 + m.vatRate / 100) };
      });
      const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100), 0);
      await prisma.quote.create({
        data: {
          tenantId: tenant.id, customerId: c.id,
          number: `${year}/${String(i + 1).padStart(4, "0")}`,
          version: 1, status,
          title: `${pick(["Rifacimento", "Adeguamento", "Manutenzione", "Installazione"])} impianto ${c.companyName || c.name}`,
          subtotal, vatTotal: vat, total: subtotal + vat,
          defaultVatRate: 22, discountPercent: 0,
          validUntil: daysAhead(30),
          sentAt: status !== "DRAFT" ? daysAgo(randInt(5, 30)) : null,
          acceptedAt: status === "ACCEPTED" ? daysAgo(randInt(1, 20)) : null,
          rejectedAt: status === "REJECTED" ? daysAgo(randInt(1, 20)) : null,
          lines: { create: lines.map((l, idx) => ({ ...l, position: idx + 1 })) },
        },
      });
    }
    console.log(`  ✓ 8 quotes`);
  }

  // 12) Invoices
  console.log("\n--- Invoices ---");
  const existingInvoices = await prisma.invoice.count({ where: { tenantId: tenant.id } });
  if (existingInvoices >= 10) {
    console.log(`  ↻ ${existingInvoices} already present, skip create`);
  } else {
    const year = new Date().getFullYear();
    for (let i = 0; i < 18; i++) {
      const c = pick(customers);
      const paid = i < 12;
      const issueDate = daysAgo(randInt(1, 180));
      const dueDate = new Date(issueDate.getTime() + 30 * 86400000);
      const overdue = dueDate < new Date() && !paid;
      const lines = Array.from({ length: randInt(1, 5) }, () => {
        const m = pick(allMaterials);
        const qty = randInt(1, 6);
        return { description: m.name, code: m.code, quantity: qty, unit: m.unit, unitPrice: m.unitPrice, discountPercent: 0, vatRate: m.vatRate, total: qty * m.unitPrice * (1 + m.vatRate / 100) };
      });
      const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100), 0);
      const total = subtotal + vat;
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id, customerId: c.id, type: "INVOICE",
          number: `${year}/${String(i + 1).padStart(4, "0")}`,
          issueDate, dueDate,
          paymentMethod: "Bonifico 30gg DF",
          paymentStatus: paid ? "PAID" : overdue ? "OVERDUE" : "UNPAID",
          paymentDate: paid ? new Date(issueDate.getTime() + randInt(10, 30) * 86400000) : null,
          amountPaid: paid ? total : 0,
          subtotal, vatTotal: vat, total,
          sdiStatus: i % 4 === 0 ? "DRAFT" : i % 4 === 1 ? "SENT" : "ACCEPTED",
          lines: { create: lines.map((l, idx) => ({ ...l, position: idx + 1 })) },
        },
      });
    }
    console.log(`  ✓ 18 invoices`);
  }

  // 13) Cashbook entries
  console.log("\n--- Cashbook ---");
  const existingCash = await prisma.cashbookEntry.count({ where: { tenantId: tenant.id } });
  if (existingCash >= 20) {
    console.log(`  ↻ ${existingCash} already present, skip create`);
  } else {
    const cats = ["Vendite", "Acquisti materiali", "Stipendi", "Tasse", "Carburante", "Manutenzione mezzi", "Spese bancarie"];
    for (let i = 0; i < 30; i++) {
      const direction = i < 18 ? "IN" : "OUT";
      const amount = direction === "IN" ? randInt(200, 5000) : randInt(50, 2000);
      const cashbox = pick(cashboxes);
      await prisma.cashbookEntry.create({
        data: {
          tenantId: tenant.id, cashboxId: cashbox.id,
          date: daysAgo(randInt(1, 180)), direction, amount,
          category: direction === "IN" ? "Vendite" : pick(cats.slice(1)),
          description: direction === "IN" ? `Incasso fattura cliente` : `${pick(cats.slice(1))} - ${pick(LAST_NAMES)}`,
          paymentMethod: pick(["Bonifico", "Contanti", "POS", "Carta credito"]),
          createdById: pick([users.admin?.id, users.massimo.id, users.giovanna.id].filter(Boolean)),
        },
      });
    }
    console.log(`  ✓ 30 cashbook entries`);
  }

  // 14) Calendar Events
  console.log("\n--- Calendar Events ---");
  const existingEv = await prisma.calendarEvent.count({ where: { tenantId: tenant.id } });
  if (existingEv >= 8) {
    console.log(`  ↻ ${existingEv} already present, skip create`);
  } else {
    const eventTypes = ["MEETING", "CALL", "TASK", "INSPECTION", "DEADLINE"];
    for (let i = 0; i < 12; i++) {
      const start = i < 6 ? daysAgo(randInt(1, 30)) : daysAhead(randInt(0, 21));
      const end = new Date(start.getTime() + randInt(30, 120) * 60000);
      const owner = pick(Object.values(users));
      await prisma.calendarEvent.create({
        data: {
          tenantId: tenant.id, ownerId: owner.id,
          title: pick(["Sopralluogo nuovo cliente", "Riunione team", "Consegna preventivo", "Verifica fine lavori", "Chiamata commerciale", "Visita cantiere"]),
          type: pick(eventTypes),
          startsAt: start, endsAt: end,
          location: pick(CITIES).name,
          reminderMinutesBefore: 60,
        },
      });
    }
    console.log(`  ✓ 12 calendar events`);
  }

  // 15) Maintenance Contracts
  console.log("\n--- Maintenance Contracts ---");
  const existingMc = await prisma.maintenanceContract.count({ where: { tenantId: tenant.id } });
  if (existingMc >= 4) {
    console.log(`  ↻ ${existingMc} already present, skip create`);
  } else {
    for (let i = 0; i < 6; i++) {
      const plant = plants.find(p => p.type === "INDUSTRIAL" || p.type === "PHOTOVOLTAIC" || p.type === "FIRE_ALARM") || pick(plants);
      const freq = pick([3, 6, 12, 24]);
      await prisma.maintenanceContract.create({
        data: {
          tenantId: tenant.id, customerId: plant.customerId, plantId: plant.id,
          name: `Manutenzione ${freq < 12 ? "trimestrale" : freq === 12 ? "annuale" : "biennale"} ${plant.name}`,
          frequencyMonths: freq,
          nextDueDate: daysAhead(randInt(10, 90)),
          feeMonthly: randInt(50, 350),
          startDate: daysAgo(randInt(30, 720)),
          active: true,
          autoInvoice: i % 2 === 0,
        },
      });
    }
    console.log(`  ✓ 6 maintenance contracts`);
  }

  // 16) DICO
  console.log("\n--- DICO ---");
  const existingDc = await prisma.conformityDeclaration.count({ where: { tenantId: tenant.id } });
  if (existingDc >= 4) {
    console.log(`  ↻ ${existingDc} already present, skip create`);
  } else {
    const year = new Date().getFullYear();
    for (let i = 0; i < 8; i++) {
      const plant = pick(plants);
      const status = pick(["DRAFT", "COMPLETE", "ISSUED", "SENT_TO_INAIL"]);
      await prisma.conformityDeclaration.create({
        data: {
          tenantId: tenant.id, customerId: plant.customerId, plantId: plant.id,
          number: `DICO-${year}-${String(i + 1).padStart(4, "0")}`,
          rtName: pick(["Geom. Marco Bianchi", "Per. Ind. Luigi Verdi", "Ing. Anna Rossi"]),
          rtRegistrationNo: `REA TV-${randInt(100000, 999999)}`,
          status,
          issueDate: status !== "DRAFT" ? daysAgo(randInt(5, 180)) : null,
          sentToInailAt: status === "SENT_TO_INAIL" ? daysAgo(randInt(1, 30)) : null,
          checklistJson: { project: true, materials: true, scheme: true, conformity: true, visura: status !== "DRAFT" },
        },
      });
    }
    console.log(`  ✓ 8 DICO`);
  }

  // 17) Purchase Orders
  console.log("\n--- Purchase Orders ---");
  const suppliers = await prisma.supplier.findMany({ where: { tenantId: tenant.id } });
  const existingPo = await prisma.purchaseOrder.count({ where: { tenantId: tenant.id } });
  if (existingPo >= 5) {
    console.log(`  ↻ ${existingPo} already present, skip create`);
  } else {
    const year = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
      const supplier = pick(suppliers);
      const lines = Array.from({ length: randInt(2, 5) }, () => {
        const m = pick(allMaterials);
        const qty = randInt(5, 30);
        return { materialCode: m.metelCode, description: m.name, quantity: qty, unit: m.unit, unitPrice: m.purchasePrice, vatRate: m.vatRate, total: qty * m.purchasePrice * (1 + m.vatRate / 100) };
      });
      const sub = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const vat = lines.reduce((s, l) => s + l.quantity * l.unitPrice * (l.vatRate / 100), 0);
      await prisma.purchaseOrder.create({
        data: {
          tenantId: tenant.id, supplierId: supplier.id, warehouseId: hq.id,
          number: `PO-${year}-${String(i + 1).padStart(4, "0")}`,
          status: i < 5 ? "RECEIVED" : i < 8 ? "CONFIRMED" : "DRAFT",
          issueDate: daysAgo(randInt(5, 90)),
          expectedDate: daysAhead(randInt(-30, 14)),
          subtotal: sub, vatTotal: vat, total: sub + vat, shippingCost: 0,
          createdById: users.admin?.id || users.massimo.id,
          lines: { create: lines.map((l, idx) => ({ ...l, position: idx + 1 })) },
        },
      });
    }
    console.log(`  ✓ 10 purchase orders`);
  }

  // 18) Vacation requests (esempi)
  console.log("\n--- Vacation Requests ---");
  const existingVac = await prisma.vacationRequest.count({ where: { tenantId: tenant.id } });
  if (existingVac < 3) {
    await prisma.vacationRequest.create({
      data: {
        tenantId: tenant.id, userId: users.andrea.id, type: "VACATION",
        startDate: daysAhead(20), endDate: daysAhead(27),
        reason: "Vacanza estiva con la famiglia", status: "PENDING", notifyDaysBefore: 7,
      },
    });
    await prisma.vacationRequest.create({
      data: {
        tenantId: tenant.id, userId: users.massimo.id, type: "PERMIT",
        startDate: daysAhead(3), endDate: daysAhead(3), halfDayStart: true,
        reason: "Visita medica", status: "APPROVED", approvedById: users.giovanna.id, approvedAt: daysAgo(1),
        notifyDaysBefore: 1,
      },
    });
    console.log(`  ✓ 2 vacation requests`);
  } else {
    console.log(`  ↻ ${existingVac} already present, skip`);
  }

  console.log("\n=== DEMO SEED COMPLETE ===");
  console.log("\nCredenziali utenti demo (password: Pozzobon2026):");
  console.log("  - massimo@isipc.com (ADMIN + tecnico)");
  console.log("  - giovanna@isipc.com (ADMIN + tecnico)");
  console.log("  - orietta@isipc.com (ADMIN + tecnico)");
  console.log("  - andrea@isipc.com (TECHNICIAN solo rapportini)");
}

main()
  .catch(e => { console.error("SEED ERROR:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
