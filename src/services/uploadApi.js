import axios from 'axios';
import { getUploadApiBaseURL } from './apiBase';

/**
 * Multipart uploads (player photos, videos, etc.).
 * Always targets the SAME backend as api.js so JWT stays valid.
 */
const uploadApi = axios.create({
  baseURL: getUploadApiBaseURL(),
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
