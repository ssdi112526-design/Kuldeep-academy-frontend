/**
 * Parse attendance QR text — supports website URL QR and legacy JSON QR.
 */
export function parseAttendanceQrText(raw) {
  const text = String(raw || '').trim();
  if (!text) return null;

  // URL QR: https://.../attendance/scan?data=<base64url>
  if (/^https?:\/\//i.test(text) || text.includes('/attendance/scan')) {
    try {
      const url = new URL(text, typeof window !== 'undefined' ? window.location.origin : 'https://www.fastsearch.in');
      const data = url.searchParams.get('data') || url.searchParams.get('payload');
      if (data) {
        const json = decodeBase64Url(data);
        return JSON.parse(json);
      }
    } catch {
      /* fall through */
    }
  }

  // Legacy: raw JSON payload
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const b64 = padded + pad;
  if (typeof atob === 'function') {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

export function encodeAttendanceQrDataParam(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  const b64 = btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}
