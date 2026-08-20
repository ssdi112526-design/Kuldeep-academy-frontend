export function triggerBlobDownload(blob, filename) {
  const file = blob instanceof Blob ? blob : new Blob([blob]);
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'download';
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Revoking immediately can cancel the download in some browsers (large files).
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 2000);
}

export function filenameFromContentDisposition(header, fallback = 'download') {
  if (!header) return fallback;
  const utf = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf?.[1]) {
    try {
      return decodeURIComponent(utf[1]).replace(/["']/g, '');
    } catch {
      return utf[1].replace(/["']/g, '');
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  if (plain?.[1]) return plain[1].trim();
  return fallback;
}

export async function parseBlobError(err) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text)?.message || 'Export failed';
    } catch {
      return 'Export failed';
    }
  }
  return data?.message || err?.message || 'Export failed';
}
