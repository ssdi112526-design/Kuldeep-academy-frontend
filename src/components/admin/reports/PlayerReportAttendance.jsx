import { useEffect, useMemo, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { attendanceService } from '../../../services';

const STATUSES = [
  { key: 'present', label: 'Present', swatch: 'bg-emerald-500', tile: 'bg-emerald-50 text-emerald-800 border-emerald-100' },
  { key: 'absent', label: 'Absent', swatch: 'bg-orange-500', tile: 'bg-orange-50 text-orange-800 border-orange-100' },
  { key: 'leave', label: 'Leave', swatch: 'bg-yellow-300', tile: 'bg-yellow-50 text-yellow-800 border-yellow-100' },
  { key: 'medical_leave', label: 'Medical Leave', swatch: 'bg-pink-500', tile: 'bg-pink-50 text-pink-800 border-pink-100' },
  { key: 'competition_leave', label: 'Competition Leave', swatch: 'bg-teal-500', tile: 'bg-teal-50 text-teal-800 border-teal-100' },
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function monthLabel(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function StatusMark({ status, sessionLabel, day }) {
  const meta = STATUSES.find((item) => item.key === status);
  if (!meta) {
    return <span className="mx-auto block h-3.5 w-3.5 rounded-[3px] bg-slate-100" aria-hidden />;
  }
  return (
    <span
      className={`mx-auto block h-3.5 w-3.5 rounded-[3px] ${meta.swatch}`}
      title={`${sessionLabel}: ${meta.label} (Day ${day})`}
      aria-label={`${sessionLabel} day ${day}: ${meta.label}`}
    />
  );
}

function countCard(counts = {}, key) {
  return counts[key] || 0;
}

export default function PlayerReportAttendance({ studentId }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [grid, setGrid] = useState(null);

  const shiftMonth = (delta) => {
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(date.getUTCFullYear());
    setMonth(date.getUTCMonth() + 1);
  };

  useEffect(() => {
    if (!studentId) return undefined;
    let alive = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await attendanceService.studentHistory(studentId, {
          period: 'select',
          year,
          month,
        });
        if (!alive) return;
        setGrid(res.data?.data?.monthlySessions || null);
      } catch {
        if (!alive) return;
        setGrid(null);
        setError('Unable to load attendance. Please try again.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [studentId, year, month]);

  const calendarCells = useMemo(() => {
    const days = grid?.days || [];
    if (!days.length) return [];
    const first = new Date(`${days[0].date}T00:00:00.000Z`);
    const pad = (first.getUTCDay() + 6) % 7;
    return [...Array.from({ length: pad }, () => null), ...days];
  }, [grid]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base font-bold text-ink">Attendance ({monthLabel(year, month)})</h3>
          <div className="flex items-center gap-2 print:hidden">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-ink hover:bg-slate-50"
              aria-label="Previous month"
            >
              <FaChevronLeft size={12} />
            </button>
            <p className="min-w-[8.5rem] text-center text-sm font-semibold text-ink">{monthLabel(year, month)}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-ink hover:bg-slate-50"
              aria-label="Next month"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-4 h-64 animate-pulse rounded-xl bg-slate-100" />
        ) : error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : !grid?.hasRecords ? (
          <p className="mt-4 text-sm text-muted">No attendance records found for this month.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-center text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-muted">
                  <th rowSpan={2} className="border border-slate-100 px-2 py-2">
                    Day
                  </th>
                  <th colSpan={5} className="border border-slate-100 px-2 py-2 text-ink">
                    Morning Session
                  </th>
                  <th colSpan={5} className="border border-slate-100 px-2 py-2 text-ink">
                    Evening Session
                  </th>
                </tr>
                <tr className="bg-white text-[10px] font-semibold text-slate-500">
                  {STATUSES.map((status) => (
                    <th key={`m-${status.key}`} className="border border-slate-100 px-1 py-2">
                      {status.label}
                    </th>
                  ))}
                  {STATUSES.map((status) => (
                    <th key={`e-${status.key}`} className="border border-slate-100 px-1 py-2">
                      {status.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.days.map((row) => (
                  <tr key={row.date}>
                    <td className="border border-slate-100 px-2 py-1.5 font-semibold text-ink">{row.day}</td>
                    {STATUSES.map((status) => (
                      <td key={`m-${row.day}-${status.key}`} className="border border-slate-100 px-1 py-1.5">
                        {row.morning?.status === status.key ? (
                          <StatusMark status={status.key} sessionLabel="Morning" day={row.day} />
                        ) : null}
                      </td>
                    ))}
                    {STATUSES.map((status) => (
                      <td key={`e-${row.day}-${status.key}`} className="border border-slate-100 px-1 py-1.5">
                        {row.evening?.status === status.key ? (
                          <StatusMark status={status.key} sessionLabel="Evening" day={row.day} />
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          {STATUSES.map((status) => (
            <div key={status.key} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <span className={`h-3 w-3 rounded-[3px] ${status.swatch}`} aria-hidden />
              <span className="font-medium">{status.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
        <h3 className="text-base font-bold text-ink">Monthly Attendance Summary</h3>
        {loading ? (
          <div className="mt-4 h-48 animate-pulse rounded-xl bg-slate-100" />
        ) : error ? (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        ) : (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-3 text-sm font-semibold text-ink">
                {monthLabel(year, month)} (Morning Session)
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted">
                {WEEKDAYS.map((day, index) => (
                  <span key={`${day}-${index}`}>{day}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {calendarCells.map((cell, index) => {
                  const status = cell?.morning?.status;
                  const meta = STATUSES.find((item) => item.key === status);
                  return (
                    <div
                      key={cell?.date || `pad-${index}`}
                      className={`flex h-9 items-center justify-center rounded-md text-xs font-semibold ${
                        !cell ? 'bg-transparent' : meta ? `${meta.tile} border` : 'bg-slate-50 text-slate-400'
                      }`}
                      title={cell ? (meta ? `Day ${cell.day}: ${meta.label}` : `Day ${cell.day}: No morning record`) : ''}
                    >
                      {cell ? cell.day : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-ink">Everyday Summary</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATUSES.map((status) => (
                  <div key={status.key} className={`rounded-xl border px-3 py-3 ${status.tile}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide">{status.label}</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums">
                      {countCard(grid?.totals?.combined, status.key)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {['morning', 'evening'].map((slot) => (
            <div key={slot} className="rounded-xl border border-slate-100 p-3">
              <p className="mb-3 text-sm font-semibold capitalize text-ink">{slot} Session</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STATUSES.map((status) => (
                  <div key={`${slot}-${status.key}`} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-[11px] text-muted">{status.label}</p>
                    <p className="text-lg font-bold tabular-nums text-ink">
                      {countCard(grid?.totals?.[slot], status.key)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
