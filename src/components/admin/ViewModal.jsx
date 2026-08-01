function Row({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || '0'}</p>
    </div>
  );
}

export default function ViewModal({ contact, onClose }) {
  if (!contact) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="view-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-slate-100 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 id="view-modal-title" className="text-lg font-bold text-ink">
            Inquiry Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-2xl leading-none text-muted hover:text-ink"
          >
            &times;
          </button>
        </div>

        <div className="mt-2 max-h-[70vh] overflow-y-auto">
          <Row label="Full Name" value={contact.fullName} />
          <Row label="Email" value={contact.email} />
          <Row label="Phone" value={contact.phone} />
          <Row label="Message" value={contact.message} />
          <Row
            label="Submitted On"
            value={
              contact.createdAt
                ? new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(contact.createdAt))
                : '0'
            }
          />
        </div>
      </div>
    </div>
  );
}
