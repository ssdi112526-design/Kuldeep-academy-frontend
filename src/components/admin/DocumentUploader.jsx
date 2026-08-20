import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaFilePdf, FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

const ACCEPT = 'image/jpeg,image/jpg,image/png,application/pdf';
const MAX = 10 * 1024 * 1024;

function isPdfFile(file, url) {
  if (file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || ''))) return true;
  return /\.pdf($|\?)/i.test(String(url || ''));
}

function fileLabel(file, url) {
  if (file?.name) return file.name;
  const path = String(url || '');
  const name = path.split('/').pop();
  return name || 'Uploaded file';
}

export default function DocumentUploader({
  label,
  file,
  storedUrl,
  onChange,
  onClear,
  busy = false,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState('');

  const validate = useCallback((picked) => {
    if (!ACCEPT.split(',').includes(picked.type) && !/\.(jpe?g|png|pdf)$/i.test(picked.name)) {
      return 'Only JPG, JPEG, PNG, and PDF are allowed';
    }
    if (picked.size > MAX) return 'File must be 10 MB or smaller';
    return '';
  }, []);

  useEffect(() => {
    if (!file || !(file instanceof File)) {
      setObjectUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (picked) => {
    if (!picked) return;
    const msg = validate(picked);
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    onChange(picked);
  };

  const stored = typeof storedUrl === 'string' && storedUrl ? mediaUrl(storedUrl) : '';
  const preview = objectUrl || stored;
  const pdf = isPdfFile(file, storedUrl || stored);
  const hasFile = Boolean(file || storedUrl);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-0.5 text-xs text-muted">JPG, JPEG, PNG, PDF · max 10 MB</p>

      <div className="mt-3">
        {preview && !pdf ? (
          <div className="relative overflow-hidden rounded-lg bg-white shadow-sm">
            <img src={preview} alt={label} className="h-36 w-full object-contain object-center" />
          </div>
        ) : null}

        {preview && pdf ? (
          <a
            href={preview}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-ink hover:border-brand/40"
          >
            <FaFilePdf className="shrink-0 text-xl text-red-500" />
            <span className="min-w-0 truncate">{fileLabel(file, storedUrl)}</span>
          </a>
        ) : null}

        {!preview ? (
          <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-white text-xs text-muted">
            No file uploaded
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-ink hover:border-brand/40 disabled:opacity-60"
        >
          <FaCloudUploadAlt />
          {hasFile ? (label === 'Add Files' ? 'Change File' : `Change ${label}`) : label === 'Add Files' ? 'Add Files' : `Upload ${label}`}
        </button>
        {hasFile ? (
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => {
              setError('');
              onClear();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            <FaTimes />
            Remove
          </button>
        ) : null}
        {busy ? <span className="text-xs font-medium text-muted">Saving…</span> : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || busy}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
