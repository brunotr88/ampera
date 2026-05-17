type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1, resetMs: windowMs };
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, resetMs: b.resetAt - now };
  }
  b.count++;
  return { ok: true, remaining: max - b.count, resetMs: b.resetAt - now };
}

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets.entries()) if (v.resetAt <= now) buckets.delete(k);
}, 60_000).unref?.();
