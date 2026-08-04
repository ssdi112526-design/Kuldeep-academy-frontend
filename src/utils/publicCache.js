/**
 * Short-lived in-memory + sessionStorage cache for public homepage APIs.
 * Prevents duplicate network work on remount / Strict Mode double-invoke.
 */
const memory = new Map();
const DEFAULT_TTL_MS = 60_000;

function storageKey(key) {
  return `ra_public_cache:${key}`;
}

export async function cachedPublicGet(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && mem.expiresAt > now) {
    return mem.value;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.expiresAt > now && parsed.value != null) {
        memory.set(key, parsed);
        return parsed.value;
      }
    }
  } catch {
    /* private mode / quota */
  }

  const value = await fetcher();
  const entry = { value, expiresAt: now + ttlMs };
  memory.set(key, entry);
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* ignore */
  }
  return value;
}

export function clearPublicCache(key) {
  if (key) {
    memory.delete(key);
    try {
      sessionStorage.removeItem(storageKey(key));
    } catch {
      /* ignore */
    }
    return;
  }
  memory.clear();
}
