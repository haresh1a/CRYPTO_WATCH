// A tiny, dependency-free in-memory cache. We use this for things
// that don't justify Redis/KV at low scale: ticker snapshots,
// CoinGecko metadata, fear/greed index, and the AI rate-limit
// counter. Each entry has a TTL; lookups after expiry return
// undefined. Single-process only — on Vercel that's fine because
// each route invocation is short-lived; the warm instance keeps
// the cache hot for a few seconds which is exactly what we want
// for ticker data.

type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key) as Entry<T> | undefined;
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

// Convenience: get-or-compute. The factory may return a Promise.
export async function cached<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== undefined) return hit;
  const value = await factory();
  cacheSet(key, value, ttlMs);
  return value;
}

// Stale-while-revalidate variant: returns the stale value
// immediately while a background refresh runs. Used for ticker
// data so the UI never shows a loading state for a 5s cache.
type SwrEntry<T> = { value: T; expires: number; staleAt: number };
const swrStore = new Map<string, SwrEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export async function swr<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const entry = swrStore.get(key) as SwrEntry<T> | undefined;

  if (entry && now < entry.expires) return entry.value;
  if (entry && now < entry.staleAt) {
    // Stale: kick off a refresh, return stale value.
    if (!inflight.has(key)) {
      const p = factory()
        .then((v) => { swrStore.set(key, { value: v, expires: now + ttlMs, staleAt: now + ttlMs * 2 }); return v; })
        .finally(() => inflight.delete(key));
      inflight.set(key, p);
    }
    return entry.value;
  }
  // Cold: await the factory.
  const p = factory();
  inflight.set(key, p);
  try {
    const v = await p;
    swrStore.set(key, { value: v, expires: now + ttlMs, staleAt: now + ttlMs * 2 });
    return v;
  } finally {
    inflight.delete(key);
  }
}
