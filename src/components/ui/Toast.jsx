export default function Toast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  // Above admin modals (z-80 / z-90) and validation popups (z-95)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] flex w-[min(100%-2rem,24rem)] flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={`pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${
            t.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span className="min-w-0 flex-1 break-words">{t.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
