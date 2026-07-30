/** Resolve uploaded image path against API origin. */
export function mediaUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:')) {
    return imagePath;
  }
  const apiBase = import.meta.env.VITE_API_URL || '';
  const origin = apiBase.replace(/\/api\/?$/, '');
  const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return origin ? `${origin}${path}` : path;
}
