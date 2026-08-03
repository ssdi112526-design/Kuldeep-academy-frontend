/**
 * Empty / null / blank → 0 for UI counts and stats.
 */

export function n0(value) {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'boolean') return value ? 1 : 0;
  const s = String(value).trim();
  if (!s || s === '—' || s === '-' || s === 'N/A' || s === 'n/a' || s === 'null') return 0;
  const n = Number(s.replace(/%/g, ''));
  if (Number.isFinite(n) && String(s).replace(/%/g, '').trim() !== '' && !Number.isNaN(n)) {
    // Only treat as number if the original looks numeric / percent
    if (/^-?\d+(\.\d+)?%?$/.test(s.replace(/\s/g, ''))) return n;
  }
  return value;
}

/** Display helper for StatCard / table numeric cells. */
export function displayZero(value) {
  const v = n0(value);
  return v === null || v === undefined || v === '' ? 0 : v;
}
