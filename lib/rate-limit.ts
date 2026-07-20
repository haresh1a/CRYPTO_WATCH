// Per-user rate limiter backed by the in-memory store. We bucket
// by `${userId}:${bucket}` with a sliding window. For multi-region
// deployments swap this for Upstash Redis — the API stays the same.

type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  reset: number;
};

export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.reset) {
    const fresh = { count: 1, reset: now + windowMs };
    buckets.set(key, fresh);
    return { ok: true, remaining: limit - 1, reset: fresh.reset };
  }
  b.count += 1;
  if (b.count > limit) {
    return { ok: false, remaining: 0, reset: b.reset };
  }
  return { ok: true, remaining: limit - b.count, reset: b.reset };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "anonymous"
  );
}
