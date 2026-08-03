import { FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

function Row({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || 0}</p>
    </div>
  );
}

export default function EntryCoachProfileModal({ coach, onClose }) {
  if (!coach) return null;
  const doc = coach.documents; // kept for certificates

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#FFFaf0] to-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">Coach Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Coach ID: <span className="font-semibold text-ink">{coach.coachCode}</span>
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

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-slate-100 bg-surface p-4">
            <img
              src={mediaUrl(coach.photo)}
              alt={coach.fullName}
              className="h-28 w-28 rounded-2xl object-cover shadow-sm bg-slate-50"
            />
            <p className="mt-3 text-sm font-bold text-ink">{coach.fullName}</p>
            <p className="mt-1 text-xs text-muted">Status: {coach.status}</p>

            <div className="mt-4">
              {/* QR Code removed */}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[70vh] pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row label="Father Name" value={coach.fatherName} />
              <Row label="Mobile" value={coach.mobile} />
              <Row label="Email" value={coach.email} />
              <Row label="DOB" value={coach.dateOfBirth ? new Date(coach.dateOfBirth).toLocaleDateString('en-IN') : ''} />
              <Row label="Experience Years" value={coach.experienceYears ?? 0} />
              <Row label="Specialization" value={coach.specialization} />
              <Row label="Qualification" value={coach.qualification} />
              <Row label="Salary" value={coach.salary ?? 0} />
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">Achievements & Biography</h3>
              <div className="mt-2 text-sm text-muted">
                <p>
                  <span className="font-semibold text-ink">Achievements:</span> {coach.achievements || 0}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-ink">Biography:</span> {coach.biography || 0}
                </p>
              </div>
            </div>

            {doc?.certificates?.length ? (
              <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
                <h3 className="text-sm font-bold text-ink">Certificates</h3>
                <p className="mt-2 text-sm text-muted">
                  {Array.isArray(doc.certificates) ? doc.certificates.length : 0} files uploaded.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

