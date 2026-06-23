const map = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the request is allowed, false if it should be rate-limited. */
export function checkRateLimit(key: string, maxReqs = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = map.get(key);

  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxReqs) return false;

  entry.count++;
  return true;
}
