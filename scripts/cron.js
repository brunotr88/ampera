// Lightweight in-process cron - runs every 5 minutes inside the same container
const APP_URL = process.env.APP_URL || "http://localhost:3000";
const SECRET = process.env.CRON_SECRET || "";

async function tick() {
  try {
    const r = await fetch(`${APP_URL}/api/cron/reminders`, { headers: { Authorization: `Bearer ${SECRET}` } });
    console.log(`[cron] ${new Date().toISOString()} - status ${r.status}`);
  } catch (e) {
    console.error("[cron]", e?.message);
  }
}

setInterval(tick, 5 * 60 * 1000);
setTimeout(tick, 30_000);
console.log("[cron] scheduler started");
