/**
 * In-Memory Client Cache with Time-To-Live (TTL)
 *
 * Prevents redundant round-trip database queries when navigating between
 * pages (e.g. Home -> Shop -> Product -> Back to Home).
 * Eliminates skeleton flickering and provides an instant, app-like response.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

/**
 * Retrieve cached data if valid and within TTL (milliseconds)
 */
export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) {
    cacheMap.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store data in client cache with current timestamp
 */
export function setCached<T>(key: string, data: T): void {
  cacheMap.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * High-performance deduplicated cached fetcher:
 * 1. Returns cached value immediately if still fresh
 * 2. Deduplicates simultaneous in-flight requests for the same key
 * 3. Saves newly fetched data to memory cache
 */
export async function cachedQuery<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key, ttlMs);
  if (cached !== null) {
    return cached;
  }

  // Deduplicate in-flight requests
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      setCached(key, data);
      pendingRequests.delete(key);
      return data;
    })
    .catch((err) => {
      pendingRequests.delete(key);
      throw err;
    });

  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate cached items matching a key or prefix
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cacheMap.clear();
    return;
  }

  for (const key of cacheMap.keys()) {
    if (key.startsWith(prefix)) {
      cacheMap.delete(key);
    }
  }
}
