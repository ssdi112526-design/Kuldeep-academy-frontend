import { getApiBaseURL, KULDEEP_PROD_API } from '../services/apiBase';

/** Resolve uploaded image path against API / media origin. */
export function mediaUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

  // Explicit media CDN / uploads host (optional)
  const mediaOrigin = (import.meta.env.VITE_MEDIA_URL || '').replace(/\/$/, '');
  if (mediaOrigin) return `${mediaOrigin}${path}`;

  const apiBase = getApiBaseURL() || KULDEEP_PROD_API;
  // Relative /api (local Vite proxy) → same-origin /uploads
  if (!apiBase || apiBase.startsWith('/')) {
    return path;
  }

  const origin = apiBase.replace(/\/api\/?$/, '');
  return origin ? `${origin}${path}` : path;
}
