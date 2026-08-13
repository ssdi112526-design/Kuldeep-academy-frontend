import {
  ATTENDANCE_STATUS_DOT,
  ATTENDANCE_STATUS_TILE,
  ATTENDANCE_STATUS_VALUE,
  ATTENDANCE_STATUSES,
  attendanceStatusMeta,
} from '../../utils/attendanceStatus';

export default function AttendanceStatusBadge({ status, className = '' }) {
  const meta = attendanceStatusMeta(status);
  const dot = ATTENDANCE_STATUS_DOT[meta.key] || 'bg-slate-400';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${meta.badgeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {meta.label}
    </span>
  );
}

export function AttendanceStatusLegend({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {ATTENDANCE_STATUSES.map((s) => (
        <div key={s.key} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${ATTENDANCE_STATUS_DOT[s.key]}`} aria-hidden />
          <span className="font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Compact color-coded status count tile for attendance dashboards */
export function AttendanceStatusCount({ statusKey, label, value, loading = false }) {
  const tile = ATTENDANCE_STATUS_TILE[statusKey] || 'border-slate-100 bg-slate-50';
  const valueClass = ATTENDANCE_STATUS_VALUE[statusKey] || 'text-ink';
  const dot = ATTENDANCE_STATUS_DOT[statusKey] || 'bg-slate-400';
  return (
    <div className={`rounded-xl border px-3 py-3 sm:px-4 ${tile}`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      </div>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${valueClass}`}>{loading ? '…' : value ?? 0}</p>
    </div>
  );
}
