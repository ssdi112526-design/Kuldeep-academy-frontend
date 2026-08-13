import { useEffect, useState } from 'react';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import {
  ReportStatCard,
  SimpleBars,
  MONTHS,
  currentMonthYear,
  reportInputClass,
} from './reportUi';

const STATUS_CARDS = [
  { key: 'present', label: 'Present', accent: 'text-emerald-600', color: 'green' },
  { key: 'absent', label: 'Absent', accent: 'text-red-600', color: 'red' },
  { key: 'leave', label: 'Leave', accent: 'text-amber-600', color: 'amber' },
  { key: 'medicalLeave', label: 'Medical', accent: 'text-purple-600', color: 'purple' },
  {
    key: 'competitionLeave',
    label: 'Competition',
    accent: 'text-orange-600',
    color: 'orange',
  },
];

export default function AttendanceDashboardPanel() {
  const toast = useToast();
  const cy = currentMonthYear();
  const [month, setMonth] = useState(cy.month);
  const [year, setYear] = useState(cy.year);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await reportsService.attendanceDashboard({ month, year });
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Failed to load attendance'));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [month, year, toast]);

  const barItems = STATUS_CARDS.map((s) => ({
    label: s.label,
    value: data?.[s.key] ?? 0,
    color: s.color,
  }));

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Attendance dashboard</h2>
          <p className="mt-1 text-sm text-muted">Monthly attendance status overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className={`${reportInputClass} w-40`}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            className={`${reportInputClass} w-28`}
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || cy.year)}
          />
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-center text-muted">Loading…</p>
      ) : !data ? (
        <p className="mt-8 text-center text-muted">No attendance data</p>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {STATUS_CARDS.map((s) => (
              <ReportStatCard
                key={s.key}
                label={s.label}
                value={data[s.key] ?? 0}
                accent={s.accent}
              />
            ))}
            <ReportStatCard
              label="Attendance %"
              value={`${Number(data.attendancePercentage ?? 0).toFixed(1)}%`}
              accent="text-brand"
            />
          </div>
          <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-ink">Status breakdown</h3>
            <div className="mt-3">
              <SimpleBars items={barItems} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
