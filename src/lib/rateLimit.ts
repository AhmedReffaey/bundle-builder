const map = new Map<string, { count: number; resetAt: number }>();
let lastPrune = 0;
const PRUNE_INTERVAL_MS = 5 * 60_000;

function pruneExpired(): void {
  const now = Date.now();
  for (const [k, entry] of map) {
    if (now > entry.resetAt) map.delete(k);
  }
  lastPrune = now;
}

/** Returns true if the request is allowed, false if it should be rate-limited. */
export function checkRateLimit(key: string, maxReqs = 5, windowMs = 60_000): boolean {
  const now = Date.now();

  // Prune expired entries every 5 minutes to prevent unbounded Map growth
  if (now - lastPrune > PRUNE_INTERVAL_MS) pruneExpired();

  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxReqs) return false;

  entry.count++;
  return true;
}
