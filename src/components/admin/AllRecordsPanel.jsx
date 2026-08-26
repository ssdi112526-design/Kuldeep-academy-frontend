import { useCallback, useEffect, useMemo, useState } from 'react';
import SearchBar from './SearchBar';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { attendanceService, entryService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { ATTENDANCE_STATUSES, normalizeAttendanceStatus } from '../../utils/attendanceStatus';
import { mediaUrl } from '../../utils/mediaUrl';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import PlayerReportDetailsModal from './reports/PlayerReportDetailsModal';

const STATUS_BTN = {
  present: {
    idle: 'border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50',
    active: 'border-emerald-500 bg-emerald-100 text-emerald-900 ring-1 ring-emerald-400',
  },
  absent: {
    idle: 'border-red-200 bg-white text-red-700 hover:bg-red-50',
    active: 'border-red-500 bg-red-100 text-red-900 ring-1 ring-red-400',
  },
  leave: {
    idle: 'border-amber-200 bg-white text-amber-800 hover:bg-amber-50',
    active: 'border-amber-500 bg-amber-100 text-amber-900 ring-1 ring-amber-400',
  },
  medical_leave: {
    idle: 'border-sky-200 bg-white text-sky-800 hover:bg-sky-50',
    active: 'border-sky-500 bg-sky-100 text-sky-900 ring-1 ring-sky-400',
  },
  competition_leave: {
    idle: 'border-violet-200 bg-white text-violet-800 hover:bg-violet-50',
    active: 'border-violet-500 bg-violet-100 text-violet-900 ring-1 ring-violet-400',
  },
};

const SHORT_LABEL = {
  present: 'P',
  absent: 'A',
  leave: 'L',
  medical_leave: 'ML',
  competition_leave: 'CL',
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTodayLabel(iso) {
  if (!iso) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${iso}T12:00:00`));
}

function PersonPhoto({ src, name }) {
  const url = mediaUrl(src);
  if (url) {
    return <img src={url} alt="" className="h-10 w-10 rounded-full object-cover bg-slate-100" />;
  }
  const letter = String(name || '?').charAt(0).toUpperCase();
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
      {letter}
    </div>
  );
}

function SlotControls({ value, busy, disabled, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1" role="group">
      {ATTENDANCE_STATUSES.map((status) => {
        const selected = normalizeAttendanceStatus(value) === status.key;
        const tone = STATUS_BTN[status.key];
        return (
          <button
            key={status.key}
            type="button"
            title={status.label}
            aria-pressed={selected}
            disabled={disabled || busy}
            onClick={() => {
              if (!selected) onSelect(status.key);
            }}
            className={`min-w-[1.85rem] cursor-pointer rounded-md border px-1.5 py-1 text-[10px] font-bold leading-none transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selected ? tone.active : tone.idle
            }`}
          >
            {SHORT_LABEL[status.key]}
          </button>
        );
      })}
    </div>
  );
}

export default function AllRecordsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = can('attendance.view') || canModule('attendance');
  const canEdit = can('attendance.edit');

  const [today] = useState(() => todayISO());
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 350);
  const [coachId, setCoachId] = useState('');
  const [playerStatus, setPlayerStatus] = useState('Active');
  const [coaches, setCoaches] = useState([]);
  const [rows, setRows] = useState([]);
  const [dateLabel, setDateLabel] = useState(() => formatTodayLabel(todayISO()));
  const [rosterDate, setRosterDate] = useState(today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingKey, setMarkingKey] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const loadCoaches = useCallback(async () => {
    try {
      const res = await entryService.coaches.list({ status: 'Active', page: 1, limit: 1000 });
      setCoaches(res.data?.data?.coaches || []);
    } catch {
      setCoaches([]);
    }
  }, []);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await attendanceService.sessionRoster({
        date: today,
        search: debouncedSearch.trim() || undefined,
        coachId: coachId || undefined,
        playerStatus: playerStatus || 'Active',
        page: 1,
        limit: 500,
      });
      const data = res.data?.data || {};
      setRows(data.rows || []);
      setRosterDate(data.date || today);
      setDateLabel(data.dateLabel || formatTodayLabel(data.date || today));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load players'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [today, debouncedSearch, coachId, playerStatus]);

  useEffect(() => {
    if (canView) loadCoaches();
  }, [canView, loadCoaches]);

  useEffect(() => {
    if (canView) loadRoster();
  }, [canView, loadRoster]);

  const openPlayer = (studentId) => {
    if (studentId) setSelectedStudentId(studentId);
  };

  const markSlot = async (studentId, sessionSlot, status) => {
    if (!canEdit || !studentId || !status) return;
    const key = `${studentId}:${sessionSlot}`;
    setMarkingKey(key);
    const prevRows = rows;
    setRows((list) =>
      list.map((row) => {
        if (row.studentId !== studentId && row.id !== studentId) return row;
        if (sessionSlot === 'morning') {
          return { ...row, morningStatus: status, morning: { ...(row.morning || {}), status } };
        }
        return { ...row, eveningStatus: status, evening: { ...(row.evening || {}), status } };
      })
    );
    try {
      await attendanceService.markStatus({
        studentId,
        date: rosterDate || today,
        status,
        sessionSlot,
      });
      toast.success('Attendance updated');
    } catch (err) {
      setRows(prevRows);
      toast.error(getApiErrorMessage(err, 'Failed to update attendance'));
    } finally {
      setMarkingKey('');
    }
  };

  const legend = useMemo(
    () =>
      ATTENDANCE_STATUSES.map((s) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
          <span
            className={`inline-flex min-w-[1.5rem] items-center justify-center rounded border px-1 py-0.5 text-[10px] font-bold ${STATUS_BTN[s.key].active}`}
          >
            {SHORT_LABEL[s.key]}
          </span>
          {s.label}
        </span>
      )),
    []
  );

  if (!canView) {
    return <AccessDenied message="You do not have permission to view All Records." />;
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-ink">
          Today: <span className="text-brand">{dateLabel}</span>
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <FormErrorBanner message={error} />
        </div>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search player by name or registration ID..."
        />
        <select
          className="w-full max-w-[14rem] rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          aria-label="Filter by coach"
        >
          <option value="">All coaches</option>
          {coaches.map((coach) => (
            <option key={coach.id || coach._id} value={coach.id || coach._id}>
              {coach.fullName}
            </option>
          ))}
        </select>
        <select
          className="w-full max-w-[11rem] rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          value={playerStatus}
          onChange={(e) => setPlayerStatus(e.target.value)}
          aria-label="Filter by player status"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">{legend}</div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-[960px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-muted">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3">Player</th>
              <th className="px-3 py-3">Registration ID</th>
              <th className="px-3 py-3">Coach</th>
              <th className="px-3 py-3">Morning Attendance</th>
              <th className="px-3 py-3">Evening Attendance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Loading players…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No players found for today’s attendance list.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const id = row.studentId || row.id;
                const morningBusy = markingKey === `${id}:morning`;
                const eveningBusy = markingKey === `${id}:evening`;
                return (
                  <tr key={id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="sticky left-0 z-[1] bg-white px-4 py-3">
                      <button
                        type="button"
                        onClick={() => openPlayer(id)}
                        className="flex cursor-pointer items-center gap-3 text-left"
                      >
                        <PersonPhoto src={row.photo} name={row.studentName} />
                        <span className="font-semibold text-ink hover:text-brand hover:underline">
                          {row.studentName}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openPlayer(id)}
                        className="cursor-pointer font-medium text-ink hover:text-brand hover:underline"
                      >
                        {row.registrationId || '—'}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-muted">{row.coachName || '—'}</td>
                    <td className="px-3 py-3">
                      <SlotControls
                        value={row.morningStatus}
                        busy={morningBusy}
                        disabled={!canEdit}
                        onSelect={(status) => markSlot(id, 'morning', status)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <SlotControls
                        value={row.eveningStatus}
                        busy={eveningBusy}
                        disabled={!canEdit}
                        onSelect={(status) => markSlot(id, 'evening', status)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!canEdit ? (
        <p className="mt-3 text-xs text-muted">You can view attendance but do not have permission to mark it.</p>
      ) : null}

      {selectedStudentId ? (
        <PlayerReportDetailsModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          onSaved={() => loadRoster()}
        />
      ) : null}
    </div>
  );
}
