/**
 * Single source of truth for production API hosts.
 * Prevents split-brain where login hits one Render service and uploads hit another
 * (causes "Invalid or expired token" / mysterious CRUD failures on live).
 */
export const KULDEEP_PROD_API = 'https://kuldeep-malik-sports-academy-backend.onrender.com/api';

function clean(url) {
  return String(url || '').trim().replace(/\/$/, '');
}

function isRaghunandan(url) {
  return /raghunandan/i.test(url || '');
}

/** Axios baseURL for normal API calls (auth, CRUD JSON, lists). */
export function getApiBaseURL() {
  const raw = clean(import.meta.env.VITE_API_URL || '/api');

  if (import.meta.env.PROD) {
    // Misconfigured Vercel env must never send Kuldeep UI to the old Raghunandan API
    if (!raw || raw.startsWith('/') || isRaghunandan(raw)) {
      return KULDEEP_PROD_API;
    }
    return raw;
  }

  return raw || '/api';
}

/**
 * BaseURL for multipart uploads.
 * MUST be the same backend that issued the JWT (getApiBaseURL).
 */
export function getUploadApiBaseURL() {
  const api = getApiBaseURL();
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return api;
  }

  const upload = clean(import.meta.env.VITE_UPLOAD_API_URL || '');
  if (upload && !isRaghunandan(upload)) return upload;

  if (import.meta.env.PROD) return KULDEEP_PROD_API;
  return api || '/api';
}
