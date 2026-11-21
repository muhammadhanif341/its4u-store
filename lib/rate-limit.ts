/** In-memory limiter for login attempts: blocks a key after `max` failures inside `windowMs`. */
export function createLimiter(max = 5, windowMs = 15 * 60 * 1000) {
  const entries = new Map<string, { count: number; first: number }>();

  return {
    isBlocked(key: string, now: number = Date.now()): boolean {
      const e = entries.get(key);
      if (!e) return false;
      if (now - e.first > windowMs) {
        entries.delete(key);
        return false;
      }
      return e.count >= max;
    },
    fail(key: string, now: number = Date.now()): void {
      const e = entries.get(key);
      if (!e || now - e.first > windowMs) entries.set(key, { count: 1, first: now });
      else e.count += 1;
    },
    reset(key: string): void {
      entries.delete(key);
    },
  };
}
