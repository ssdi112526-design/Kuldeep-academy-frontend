import { useCallback, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTimes, FaVideo } from 'react-icons/fa';

const ACCEPT = 'video/mp4,video/webm,.mp4,.webm,.MP4,.WEBM';
const MAX = 500 * 1024 * 1024;

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VideoUploader({
  file,
  currentPath,
  onChange,
  onClear,
  label = 'Upload Video',
  progress = null,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validate = useCallback((f) => {
    const okType =
      ['video/mp4', 'video/webm'].includes(f.type) || /\.(mp4|webm)$/i.test(f.name);
    if (!okType) return 'Invalid file type. Only MP4 and WebM video files are allowed.';
    if (f.size > MAX) return 'Video is too large. Maximum size is 500 MB.';
    if (f.size < 1024) return 'File looks empty or corrupt. Choose another video.';
    return '';
  }, []);

  const handleFiles = (fileList) => {
    if (disabled) return;
    const next = fileList?.[0];
    if (!next) return;
    const msg = validate(next);
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    onChange(next);
  };

  const openPicker = (e) => {
    e?.stopPropagation?.();
    if (disabled) return;
    inputRef.current?.click();
  };

  const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : null;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${dragOver ? 'border-brand bg-brand/5' : 'border-slate-200 bg-slate-50 hover:border-brand/40'}`}
        onClick={openPicker}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') openPicker(e);
        }}
      >
        <FaCloudUploadAlt className="mb-2 text-3xl text-brand" />
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">Drag & drop a video here, or choose a file</p>
        <p className="mt-1 text-xs text-muted">MP4, WebM · max 500 MB</p>
        <button
          type="button"
          onClick={openPicker}
          disabled={disabled}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-60"
        >
          Choose Video
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs font-medium text-red-600">{error}</p> : null}

      {file ? (
        <div className="relative mt-3 rounded-lg border border-slate-100 bg-white p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <FaVideo />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{file.name}</p>
              <p className="text-xs text-muted">{formatSize(file.size)}</p>
            </div>
            {onClear && !disabled ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="rounded-full bg-white p-1.5 text-red-500 shadow"
                aria-label="Remove video"
              >
                <FaTimes size={10} />
              </button>
            ) : null}
          </div>
          {pct != null ? (
            <div className="mt-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span>{pct < 100 ? 'Uploading…' : 'Upload complete'}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-200"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : currentPath ? (
        <p className="mt-2 text-xs text-muted">Current file on server: {currentPath}</p>
      ) : null}
    </div>
  );
}
