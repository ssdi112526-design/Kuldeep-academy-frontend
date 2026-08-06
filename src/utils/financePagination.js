/** Shared helper for admin finance pagination props */
export function toPagination(data, page, limit = 20) {
  const total = data?.total || 0;
  const lim = data?.limit || limit;
  const p = data?.page || page || 1;
  const pages = Math.max(1, Math.ceil(total / lim) || 1);
  return { page: p, pages, total, limit: lim };
}
