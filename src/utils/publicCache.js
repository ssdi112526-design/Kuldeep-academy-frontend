/**
 * Short-lived cache for public homepage APIs.
 * Admin mutations call clearPublicCache() which bumps a localStorage revision
 * so all tabs discard stale data immediately (sessionStorage alone is per-tab).
 */
const memory = new Map();
const DEFAULT_TTL_MS = 12_000;
const REV_KEY = 'ra_public_rev';
const BUST_EVENT = 'ra-public-cache-bust';
const PREFIX = 'ra_public_cache:';

function storageKey(key) {
  return `${PREFIX}${key}`;
}

export function getPublicCacheRev() {
  try {
    return localStorage.getItem(REV_KEY) || '0';
  } catch {
    return '0';
  }
}

function bumpRevision() {
  try {
    localStorage.setItem(REV_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BUST_EVENT, { detail: { at: Date.now() } }));
  }
}

function clearSessionKeys(key) {
  try {
    if (key) {
      sessionStorage.removeItem(storageKey(key));
      return;
    }
    Object.keys(sessionStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

export async function cachedPublicGet(key, fetcher, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const rev = getPublicCacheRev();
  const mem = memory.get(key);
  if (mem && mem.expiresAt > now && mem.rev === rev) {
    return mem.value;
  }

  try {
    const raw = sessionStorage.getItem(storageKey(key));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.expiresAt > now && parsed.rev === rev && parsed.value != null) {
        memory.set(key, parsed);
        return parsed.value;
      }
    }
  } catch {
    /* private mode / quota */
  }

  const value = await fetcher();
  const entry = { value, expiresAt: now + ttlMs, rev };
  memory.set(key, entry);
  try {
    sessionStorage.setItem(storageKey(key), JSON.stringify(entry));
  } catch {
    /* ignore */
  }
  return value;
}

/** Invalidate cache after admin create/update/delete. Cross-tab via localStorage. */
export function clearPublicCache(key) {
  if (key) {
    memory.delete(key);
    clearSessionKeys(key);
  } else {
    memory.clear();
    clearSessionKeys();
  }
  bumpRevision();
}

/**
 * Subscribe to cache invalidation (same tab + other tabs).
 * Callback should re-fetch public data.
 */
export function onPublicCacheBust(callback) {
  if (typeof window === 'undefined') return () => {};

  const onLocal = () => callback();
  const onStorage = (e) => {
    if (e.key === REV_KEY) callback();
  };

  window.addEventListener(BUST_EVENT, onLocal);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(BUST_EVENT, onLocal);
    window.removeEventListener('storage', onStorage);
  };
}
