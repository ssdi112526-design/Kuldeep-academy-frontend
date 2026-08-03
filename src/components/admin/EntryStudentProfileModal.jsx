import { useMemo } from 'react';
import { FaPrint, FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

function Row({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || 0}</p>
    </div>
  );
}

export default function EntryStudentProfileModal({ student, onClose }) {
  const coach = student?.coach;

  const quick = useMemo(() => {
    if (!student) return null;
    return {
      status: student.status,
      membershipType: student.membershipType,
      batch: student.batch,
      coachName: coach?.fullName || 0,
      joiningDate: student.joiningDate ? new Date(student.joiningDate).toLocaleDateString('en-IN') : 0,
      dob: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-IN') : 0,
    };
  }, [student, coach]);

  if (!student) return null;

  const present = student.attendancePresent ?? 0;
  const total = student.attendanceTotal ?? present;
  const rate = total ? Math.round((present / total) * 1000) / 10 : 0;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#FFFaf0] to-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">Student Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Registration: <span className="font-semibold text-ink">{student.registrationNumber}</span>
            </p>
            <p className="mt-1 text-xs text-muted">Login username: {student.registrationNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border border-brand/30 bg-white px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10"
            >
              <FaPrint />
              Print
            </button>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-xl p-2 text-muted hover:text-ink">
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[320px_1fr]">
          <div className="rounded-xl border border-slate-100 bg-surface p-4">
            <div className="flex items-center gap-3">
              <img
                src={mediaUrl(student.photo)}
                alt={student.fullName}
                className="h-20 w-20 rounded-xl object-cover shadow-sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{student.fullName}</p>
                <p className="mt-1 text-xs text-muted">Status: {quick?.status}</p>
              </div>
            </div>

            <div className="mt-4 space-y-0">
              <Row label="Father Name" value={student.fatherName} />
              <Row label="Mother Name" value={student.motherName} />
              <Row label="Gender" value={student.gender} />
              <Row label="Date of Birth" value={quick?.dob} />
              <Row label="Blood Group" value={student.bloodGroup} />
              <Row label="Mobile" value={student.mobileNumber} />
              <Row label="Email" value={student.email} />
              <Row label="Coach" value={quick?.coachName} />
              <Row label="Joining Date" value={quick?.joiningDate} />
            </div>
          </div>

          <div>
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">Training Details</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Row label="Membership Type" value={student.membershipType} />
                <Row label="Batch" value={student.batch} />
                <Row label="Training Level" value={student.trainingLevel} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <h3 className="text-sm font-bold text-ink">QR Attendance Summary</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs text-muted">Present</p>
                    <p className="mt-1 font-bold text-ink">{present}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs text-muted">Sessions</p>
                    <p className="mt-1 font-bold text-ink">{total}</p>
                  </div>
                  <div className="rounded-lg border border-slate-100 p-3">
                    <p className="text-xs text-muted">Rate</p>
                    <p className="mt-1 font-bold text-ink">{rate}%</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <h3 className="text-sm font-bold text-ink">Payment</h3>
                <Row label="Payment" value={student.paymentStatus} />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">Achievements & Notes</h3>
              <div className="mt-2 text-sm text-muted">
                <p>
                  <span className="font-semibold text-ink">Achievements:</span> {student.achievements || 0}
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-ink">Admin Notes:</span> {student.adminNotes || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
