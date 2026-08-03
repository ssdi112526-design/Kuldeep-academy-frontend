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

  const apiBase = import.meta.env.VITE_API_URL || '';
  // Relative /api (Vercel rewrite) → keep same-origin /uploads (proxied by vercel.json)
  if (!apiBase || apiBase.startsWith('/')) {
    return path;
  }

  const origin = apiBase.replace(/\/api\/?$/, '');
  return origin ? `${origin}${path}` : path;
}
