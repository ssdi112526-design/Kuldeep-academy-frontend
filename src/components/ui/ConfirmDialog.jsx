import Button from './Button';

const dangerButtonClasses =
  'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60 bg-red-600 text-white hover:bg-red-700';

export default function ConfirmDialog({
  open,
  title = 'Are you sure you want to delete this?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/50 px-4 backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-100 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-lg font-bold text-ink">
          {title}
        </h2>
        {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          {danger ? (
            <button type="button" className={dangerButtonClasses} onClick={onConfirm} disabled={loading}>
              {loading ? 'Please wait…' : confirmLabel}
            </button>
          ) : (
            <Button onClick={onConfirm} disabled={loading}>
              {loading ? 'Please wait…' : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
