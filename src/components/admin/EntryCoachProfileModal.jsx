import { FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

function Row({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || '—'}</p>
    </div>
  );
}

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EntryCoachProfileModal({ coach, onClose }) {
  if (!coach) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#FFFaf0] to-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">Employee Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Employee ID: <span className="font-semibold text-ink">{coach.coachCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-muted hover:text-ink"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[240px_1fr]">
          <div className="rounded-xl border border-slate-100 bg-surface p-4">
            <img
              src={mediaUrl(coach.photo)}
              alt={coach.fullName}
              className="h-28 w-28 rounded-2xl object-cover shadow-sm bg-slate-50"
            />
            <p className="mt-3 text-sm font-bold text-ink">{coach.fullName}</p>
            <p className="mt-1 text-xs text-muted">Status: {coach.status || '—'}</p>
          </div>

          <div className="overflow-y-auto max-h-[70vh] pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row label="Mobile" value={coach.mobile} />
              <Row label="Email" value={coach.email} />
              <Row label="Date of Birth" value={formatDisplayDate(coach.dateOfBirth)} />
              <Row label="Gender" value={coach.gender} />
              <Row label="Aadhaar" value={coach.aadhaarNumber} />
              <Row label="PAN" value={coach.panNumber} />
              <Row label="Joining Date" value={formatDisplayDate(coach.joiningDate)} />
              <Row label="Role" value={coach.employeeRole} />
              <Row label="Category" value={coach.category} />
              <Row
                label="Salary"
                value={
                  coach.salary != null && Number(coach.salary) > 0
                    ? `₹${Number(coach.salary).toLocaleString('en-IN')} / month`
                    : '—'
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
