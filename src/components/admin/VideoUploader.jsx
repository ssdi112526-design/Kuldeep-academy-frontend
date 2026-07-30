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
  label = 'Upload video (MP4 / WebM)',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validate = useCallback((f) => {
    const okType =
      ['video/mp4', 'video/webm'].includes(f.type) || /\.(mp4|webm)$/i.test(f.name);
    if (!okType) return 'Only MP4 and WebM video files are allowed';
    if (f.size > MAX) return 'Video must be 500 MB or smaller';
    return '';
  }, []);

  const handleFiles = (fileList) => {
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

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver ? 'border-brand bg-brand/5' : 'border-slate-200 bg-slate-50 hover:border-brand/40'
        }`}
      >
        <FaCloudUploadAlt className="mb-2 text-2xl text-brand" />
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="mt-1 text-xs text-muted">MP4, WebM · max 500 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {file ? (
        <div className="relative mt-3 flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <FaVideo />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{file.name}</p>
            <p className="text-xs text-muted">{formatSize(file.size)}</p>
          </div>
          {onClear ? (
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
      ) : currentPath ? (
        <p className="mt-2 text-xs text-muted">Current file: {currentPath}</p>
      ) : null}
    </div>
  );
}
