import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp';
const MAX = 10 * 1024 * 1024;

export default function ImageUploader({
  value,
  previewUrl,
  multiple = false,
  onChange,
  onClear,
  label = 'Upload image',
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState('');

  const validate = useCallback((file) => {
    if (!ACCEPT.split(',').includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      return 'Only JPG, JPEG, PNG, and WEBP are allowed';
    }
    if (file.size > MAX) return 'Image must be 10 MB or smaller';
    return '';
  }, []);

  useEffect(() => {
    if (!value || typeof value === 'string' || Array.isArray(value) || !(value instanceof File)) {
      setObjectUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const handleFiles = (fileList) => {
    const files = [...fileList];
    if (!files.length) return;
    for (const file of files) {
      const msg = validate(file);
      if (msg) {
        setError(msg);
        return;
      }
    }
    setError('');
    onChange(multiple ? files : files[0]);
  };

  const resolvedPreviewUrl =
    typeof previewUrl === 'string' && previewUrl
      ? mediaUrl(previewUrl)
      : previewUrl || null;

  const preview =
    objectUrl ||
    resolvedPreviewUrl ||
    (value && typeof value === 'string' ? mediaUrl(value) : null);

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
        <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP · max 10 MB{multiple ? ' · multiple' : ''}</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files || [])}
        />
      </div>

      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}

      {preview ? (
        <div className="relative mt-3 inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-28 w-40 rounded-lg object-cover shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {onClear ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1.5 text-red-500 shadow"
              aria-label="Remove image"
            >
              <FaTimes size={10} />
            </button>
          ) : null}
        </div>
      ) : null}

      {multiple && Array.isArray(value) && value.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {value.map((file, i) => (
            <div key={`${file.name}-${i}`} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="h-20 w-20 rounded-lg object-cover"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
