/** Shared player attendance status helpers (client) */

export const ATTENDANCE_STATUSES = [
  { key: 'present', label: 'Present', badgeClass: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  { key: 'absent', label: 'Absent', badgeClass: 'bg-red-50 text-red-700 ring-red-200' },
  { key: 'leave', label: 'Leave', badgeClass: 'bg-amber-50 text-amber-800 ring-amber-200' },
  { key: 'medical_leave', label: 'Medical Leave', badgeClass: 'bg-violet-50 text-violet-800 ring-violet-200' },
  {
    key: 'competition_leave',
    label: 'Competition Leave',
    badgeClass: 'bg-orange-50 text-orange-800 ring-orange-300',
  },
];

export const ATTENDANCE_STATUS_DOT = {
  present: 'bg-emerald-600',
  absent: 'bg-red-600',
  leave: 'bg-amber-400',
  medical_leave: 'bg-violet-600',
  competition_leave: 'bg-orange-600',
};

/** Soft tile backgrounds for dashboard status counts */
export const ATTENDANCE_STATUS_TILE = {
  present: 'border-emerald-100 bg-emerald-50/80',
  absent: 'border-red-100 bg-red-50/80',
  leave: 'border-amber-100 bg-amber-50/80',
  medical_leave: 'border-violet-100 bg-violet-50/80',
  competition_leave: 'border-orange-100 bg-orange-50/70',
};

export const ATTENDANCE_STATUS_VALUE = {
  present: 'text-emerald-800',
  absent: 'text-red-700',
  leave: 'text-amber-800',
  medical_leave: 'text-violet-800',
  competition_leave: 'text-orange-800',
};

export function normalizeAttendanceStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
  if (raw === 'medical' || raw === 'medicalleave') return 'medical_leave';
  if (raw === 'competition' || raw === 'competitionleave') return 'competition_leave';
  if (ATTENDANCE_STATUSES.some((s) => s.key === raw)) return raw;
  return null;
}

export function attendanceStatusMeta(status) {
  const key = normalizeAttendanceStatus(status) || (String(status || '').toLowerCase() === 'present' ? 'present' : null);
  return (
    ATTENDANCE_STATUSES.find((s) => s.key === key) || {
      key: 'absent',
      label: status || 'Absent',
      badgeClass: 'bg-red-50 text-red-700 ring-red-200',
    }
  );
}
