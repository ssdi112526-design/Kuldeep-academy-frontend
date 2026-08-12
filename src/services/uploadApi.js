import axios from 'axios';

/**
 * Large multipart uploads (videos) must bypass the Vercel → Render rewrite.
 * Vercel proxied requests hard-timeout at ~120s, which surfaces as Axios "Network Error".
 */
function resolveUploadBaseURL() {
  const upload = (import.meta.env.VITE_UPLOAD_API_URL || '').trim();
  if (upload) return upload.replace(/\/$/, '');

  const api = (import.meta.env.VITE_API_URL || '/api').trim();
  // Relative /api is fine locally (Vite proxy) but unsafe for big live uploads.
  if (api.startsWith('http://') || api.startsWith('https://')) {
    return api.replace(/\/$/, '');
  }

  // Production fallback when only VITE_API_URL=/api is set
  if (import.meta.env.PROD) {
    return 'https://raghunandan-akhada-backend.onrender.com/api';
  }

  return api || '/api';
}

const uploadApi = axios.create({
  baseURL: resolveUploadBaseURL(),
  timeout: 15 * 60 * 1000,
});

uploadApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('kra_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

/** Wake Render free tier before a long upload so cold-start doesn't eat the budget. */
export async function wakeUploadBackend() {
  try {
    await uploadApi.get('/site-settings', { timeout: 60_000 });
  } catch {
    /* best-effort */
  }
}

export default uploadApi;
