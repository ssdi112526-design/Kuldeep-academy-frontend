import { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaDownload, FaUserCheck, FaUserTimes, FaUsers } from 'react-icons/fa';
import Button from '../ui/Button';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import StatCard from './StatCard';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { attendanceService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { attendanceStatusMeta, normalizeAttendanceStatus } from '../../utils/attendanceStatus';
import AttendanceStatusBadge, {
  AttendanceStatusCount,
  AttendanceStatusFilterOptions,
  AttendanceStatusLegend,
  MarkStatusSelect,
} from '../ui/AttendanceStatusBadge';
import { mediaUrl } from '../../utils/mediaUrl';
import useDebouncedValue from '../../hooks/useDebouncedValue';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(value) {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0' || value === '—') {
    return '—';
  }
  if (typeof value === 'string' && value.includes(':') && !value.includes('T')) return value;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatSelectedDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function exportDownloadName(periodMode, selectedMonth, from, to, reportType) {
  const stamp = (() => {
    if (periodMode === 'all') return 'all_time';
    if (periodMode === 'select' && selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      const label = new Date(Date.UTC(y, m - 1, 1)).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      });
      return label.toLowerCase().replace(/\s+/g, '_');
    }
    if (periodMode === 'custom' && from && to) return `${from}_to_${to}`;
    if (periodMode === 'month') {
      const now = new Date();
      const label = now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' });
      return label.toLowerCase().replace(/\s+/g, '_');
    }
    return 'attendance';
  })();
  const suffix = reportType === 'summary' ? '_summary' : '';
  return `kuldeep_academy_student_attendance_${stamp}${suffix}.xlsx`;
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

export default function AttendancePanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = can('attendance.view') || canModule('attendance');
  const canEdit = can('attendance.edit');
  const canExport = can('attendance.export');

  const [tab, setTab] = useState('mark');
  const [date, setDate] = useState(todayISO());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [rosterSearch, setRosterSearch] = useState('');
  const debouncedRosterSearch = useDebouncedValue(rosterSearch, 350);
  const [rosterStatus, setRosterStatus] = useState('all');
  const [roster, setRoster] = useState([]);
  const [rosterSummary, setRosterSummary] = useState(null);
  const [rosterPagination, setRosterPagination] = useState({ page: 1, limit: 50, total: 0, pages: 1 });
  const [rosterLoading, setRosterLoading] = useState(false);
  const [markingKey, setMarkingKey] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodMode, setPeriodMode] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [from, setFrom] = useState(todayISO().slice(0, 8) + '01');
  const [to, setTo] = useState(todayISO());
  const [records, setRecords] = useState([]);
  const [recordsSummary, setRecordsSummary] = useState(null);
  const [studentSummary, setStudentSummary] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  const periodParams = useCallback(() => {
    const params = {
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      view: 'matrix',
    };
    if (periodMode === 'all') {
      params.period = 'all';
    } else if (periodMode === 'select' && selectedMonth) {
      const [y, m] = selectedMonth.split('-');
      params.period = 'select';
      params.year = y;
      params.month = m;
    } else if (periodMode === 'custom') {
      params.period = 'custom';
      params.from = from;
      params.to = to;
    } else {
      params.period = 'month';
    }
    return params;
  }, [periodMode, selectedMonth, from, to, search, statusFilter]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await attendanceService.stats({ date });
      setStats(res.data?.data || null);
      setError('');
    } catch (err) {
      setStats(null);
      setError(getApiErrorMessage(err, 'Unable to load attendance stats.'));
    } finally {
      setStatsLoading(false);
    }
  }, [date]);

  const loadRoster = useCallback(
    async (page = 1) => {
      setRosterLoading(true);
      try {
        const res = await attendanceService.roster({
          date,
          search: debouncedRosterSearch.trim() || undefined,
          status: rosterStatus !== 'all' ? rosterStatus : undefined,
          page,
          limit: rosterPagination.limit,
        });
        const data = res.data?.data || {};
        setRoster(data.rows || []);
        setRosterSummary(data.summary || null);
        setRosterPagination(data.pagination || { page: 1, limit: rosterPagination.limit, total: 0, pages: 1 });
        setError('');
      } catch (err) {
        setRoster([]);
        setError(getApiErrorMessage(err, 'Unable to load attendance list.'));
      } finally {
        setRosterLoading(false);
      }
    },
    [date, debouncedRosterSearch, rosterStatus, rosterPagination.limit]
  );

  const loadRecords = useCallback(
    async (page = 1) => {
      if (periodMode === 'select' && !selectedMonth) return;
      if (periodMode === 'custom' && (!from || !to)) return;
      setRecordsLoading(true);
      setError('');
      setRecords([]);
      setStudentSummary([]);
      setRecordsSummary(null);
      try {
        const base = periodParams();
        const [recRes, sumRes] = await Promise.all([
          attendanceService.records({
            ...base,
            page,
            limit: pagination.limit,
          }),
          attendanceService.studentSummary(base),
        ]);
        setRecords(recRes.data?.data?.records || []);
        setRecordsSummary(recRes.data?.data?.summary || null);
        setPagination(recRes.data?.data?.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        setStudentSummary(sumRes.data?.data?.students || []);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Unable to load attendance records. Please try again.'));
        setRecords([]);
        setStudentSummary([]);
      } finally {
        setRecordsLoading(false);
      }
    },
    [periodParams, periodMode, selectedMonth, from, to, pagination.limit]
  );

  const openStudentHistory = async (studentId) => {
    if (!studentId) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await attendanceService.studentHistory(studentId, periodParams());
      setHistoryData(res.data?.data || null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Unable to load student history'));
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMonths = useCallback(async () => {
    try {
      const res = await attendanceService.months();
      const months = res.data?.data?.months || [];
      setAvailableMonths(months);
      setSelectedMonth((prev) => {
        if (prev) return prev;
        if (!months[0]) return '';
        return `${months[0].year}-${String(months[0].month).padStart(2, '0')}`;
      });
    } catch {
      setAvailableMonths([]);
    }
  }, []);

  useEffect(() => {
    if (!canView) return;
    loadStats();
  }, [canView, loadStats]);

  useEffect(() => {
    if (!canView || tab !== 'mark') return;
    loadRoster(1);
  }, [canView, tab, loadRoster]);

  useEffect(() => {
    if (!canView || tab !== 'records') return;
    loadMonths();
  }, [canView, tab, loadMonths]);

  useEffect(() => {
    if (!canView || tab !== 'records') return;
    loadRecords(1);
  }, [canView, tab, periodMode, selectedMonth, from, to, statusFilter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (reportType = 'matrix') => {
    if (!canExport) {
      toast.error('You do not have permission to export');
      return;
    }
    setExporting(true);
    try {
      const payload = { ...periodParams(), reportType };
      const res = await attendanceService.exportRecords(payload);
      const name = exportDownloadName(periodMode, selectedMonth, from, to, reportType);
      triggerBlobDownload(res.data, name);
      toast.success('Attendance Excel downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  const handleMarkStatus = async (row, status) => {
    if (!canEdit) {
      toast.error('You do not have permission to mark attendance');
      return;
    }
    const studentId = row.student?.id || row.studentId;
    const markDate = row.date || date;
    const nextKey = normalizeAttendanceStatus(status);
    if (!studentId || !markDate || !nextKey) return;
    const currentKey = normalizeAttendanceStatus(row.statusKey || row.status) || 'absent';
    if (nextKey === currentKey) return;
    const key = `${studentId}_${markDate}`;
    const meta = attendanceStatusMeta(nextKey);
    setMarkingKey(key);
    try {
      await attendanceService.markStatus({ studentId, date: markDate, status: nextKey });
      toast.success(`Marked ${meta.label}`);
      setRoster((prev) =>
        prev.map((r) =>
          (r.studentId || r.student?.id) === studentId
            ? { ...r, statusKey: nextKey, status: meta.label, statusLabel: meta.label }
            : r
        )
      );
      await Promise.all([
        tab === 'records' ? loadRecords(pagination.page) : loadRoster(rosterPagination.page),
        loadStats(),
      ]);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update attendance status'));
    } finally {
      setMarkingKey('');
    }
  };

  const periodBtn = (id, label) => (
    <button
      key={id}
      type="button"
      onClick={() => setPeriodMode(id)}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition sm:px-3.5 sm:text-sm ${
        periodMode === id ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-white'
      }`}
    >
      {label}
    </button>
  );

  if (!canView) return <AccessDenied />;

  return (
    <div className="space-y-5">
      <FormErrorBanner message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Student Attendance</h2>
          <p className="mt-0.5 text-sm text-muted">Mark daily attendance manually, then review reports and exports.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Attendance date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setTab('mark')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === 'mark' ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-white'
              }`}
            >
              Mark Attendance
            </button>
            <button
              type="button"
              onClick={() => setTab('records')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === 'records' ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-white'
              }`}
            >
              Reports
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-ink">{formatSelectedDate(date)}</h3>
            <p className="text-xs text-muted">Selected date: {date}</p>
          </div>
          <AttendanceStatusLegend />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total Students"
            value={stats?.totalStudents ?? rosterSummary?.totalStudents ?? 0}
            icon={FaUsers}
            loading={statsLoading}
          />
          <StatCard
            label="Present"
            value={stats?.present ?? rosterSummary?.present ?? 0}
            icon={FaUserCheck}
            loading={statsLoading}
          />
          <StatCard
            label="Absent"
            value={stats?.absent ?? rosterSummary?.absent ?? 0}
            icon={FaUserTimes}
            loading={statsLoading}
          />
          <StatCard
            label="Attendance %"
            value={`${stats?.attendanceRate ?? rosterSummary?.attendanceRate ?? 0}%`}
            icon={FaCheck}
            loading={statsLoading}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          <AttendanceStatusCount
            statusKey="present"
            label="Present"
            value={stats?.present ?? 0}
            loading={statsLoading}
          />
          <AttendanceStatusCount
            statusKey="absent"
            label="Absent"
            value={stats?.absent ?? 0}
            loading={statsLoading}
          />
          <AttendanceStatusCount
            statusKey="leave"
            label="Leave"
            value={stats?.leave ?? 0}
            loading={statsLoading}
          />
          <AttendanceStatusCount
            statusKey="medical_leave"
            label="Medical Leave"
            value={stats?.medicalLeave ?? 0}
            loading={statsLoading}
          />
          <AttendanceStatusCount
            statusKey="competition_leave"
            label="Competition Leave"
            value={stats?.competitionLeave ?? 0}
            loading={statsLoading}
          />
        </div>
      </div>

      {tab === 'mark' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <span className="mb-1 block text-xs text-muted">Search student</span>
                <SearchBar value={rosterSearch} onChange={setRosterSearch} placeholder="Name / Registration No." />
              </div>
              <label className="text-sm lg:w-48">
                <span className="mb-1 block text-xs text-muted">Status</span>
                <select
                  value={rosterStatus}
                  onChange={(e) => setRosterStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <AttendanceStatusFilterOptions />
                </select>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Registration No.</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit ? <th className="px-4 py-3">Mark</th> : null}
                </tr>
              </thead>
              <tbody>
                {rosterLoading ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : roster.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted">
                      No students found for this date.
                    </td>
                  </tr>
                ) : (
                  roster.map((r) => {
                    const studentId = r.studentId || r.student?.id;
                    const rowKey = `${studentId}_${r.date || date}`;
                    const name = r.studentName || r.student?.fullName || '—';
                    return (
                      <tr key={rowKey} className="border-t border-slate-100">
                        <td className="px-4 py-3">
                          <PersonPhoto src={r.photo || r.student?.photo} name={name} />
                        </td>
                        <td className="px-4 py-3 font-medium">{r.registrationId || '—'}</td>
                        <td className="px-4 py-3 font-medium">{name}</td>
                        <td className="px-4 py-3">{formatDate(r.date || date)}</td>
                        <td className="px-4 py-3">
                          <AttendanceStatusBadge status={r.statusKey || r.status} />
                        </td>
                        {canEdit ? (
                          <td className="px-4 py-3">
                            <MarkStatusSelect
                              statusKey={r.statusKey || r.status}
                              busy={markingKey === rowKey}
                              onChange={(status) => handleMarkStatus(r, status)}
                            />
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={rosterPagination}
            onPageChange={(p) => loadRoster(p)}
            onLimitChange={(limit) => {
              setRosterPagination((prev) => ({ ...prev, limit, page: 1 }));
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Attendance Reports</h3>
                <p className="mt-0.5 text-xs text-muted">Filter by period, student, and status. Excel includes Present and Absent.</p>
              </div>
              <div className="inline-flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
                {periodBtn('month', 'This Month')}
                {periodBtn('select', 'Select Month')}
                {periodBtn('custom', 'Custom Range')}
                {periodBtn('all', 'All Time')}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {periodMode === 'select' ? (
                <label className="text-sm sm:col-span-1">
                  <span className="mb-1 block text-xs text-muted">Month</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {availableMonths.length === 0 ? <option value="">No months yet</option> : null}
                    {availableMonths.map((m) => {
                      const val = `${m.year}-${String(m.month).padStart(2, '0')}`;
                      return (
                        <option key={val} value={val}>
                          {m.label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              ) : null}

              {periodMode === 'custom' ? (
                <>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-muted">From</span>
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-xs text-muted">To</span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </>
              ) : null}

              <div className="sm:col-span-2 lg:col-span-2">
                <span className="mb-1 block text-xs text-muted">Search student</span>
                <SearchBar value={search} onChange={setSearch} placeholder="Name / Registration No. / Father Name" />
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <AttendanceStatusFilterOptions />
                </select>
              </label>
              <div className="flex items-end">
                <Button variant="secondary" onClick={() => loadRecords(1)} className="w-full rounded-lg">
                  Apply filters
                </Button>
              </div>
            </div>

            {canExport ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <Button onClick={() => handleExport('matrix')} disabled={exporting} className="rounded-lg">
                  <FaDownload className="mr-2" />
                  {exporting ? 'Generating Excel…' : 'Download Excel'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleExport('summary')}
                  disabled={exporting}
                  className="rounded-lg"
                >
                  Summary Excel
                </Button>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex min-w-[10rem] flex-col justify-center rounded-xl border border-brand/15 bg-gradient-to-br from-[#FFF8F0] to-white px-5 py-4 lg:w-44">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Attendance %</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-ink">
                {recordsLoading
                  ? '…'
                  : `${recordsSummary?.attendancePercentage ?? recordsSummary?.attendanceRate ?? 0}%`}
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              <AttendanceStatusCount
                statusKey="present"
                label="Present"
                value={recordsSummary?.presentStudentDays ?? recordsSummary?.present ?? 0}
                loading={recordsLoading}
              />
              <AttendanceStatusCount
                statusKey="absent"
                label="Absent"
                value={recordsSummary?.absentStudentDays ?? recordsSummary?.absent ?? 0}
                loading={recordsLoading}
              />
              <AttendanceStatusCount
                statusKey="leave"
                label="Leave"
                value={recordsSummary?.leaveStudentDays ?? recordsSummary?.leave ?? 0}
                loading={recordsLoading}
              />
              <AttendanceStatusCount
                statusKey="medical_leave"
                label="Medical Leave"
                value={recordsSummary?.medicalLeaveStudentDays ?? recordsSummary?.medicalLeave ?? 0}
                loading={recordsLoading}
              />
              <AttendanceStatusCount
                statusKey="competition_leave"
                label="Competition Leave"
                value={recordsSummary?.competitionLeaveStudentDays ?? recordsSummary?.competitionLeave ?? 0}
                loading={recordsLoading}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h4 className="text-sm font-bold text-ink">Student Attendance Summary</h4>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Registration No.</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Training Days</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Leave</th>
                  <th className="px-4 py-3">%</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : studentSummary.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-muted">
                      No student summary for this period.
                    </td>
                  </tr>
                ) : (
                  studentSummary.map((s) => (
                    <tr key={s.studentId} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{s.registrationId}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-brand hover:underline"
                          onClick={() => openStudentHistory(s.studentId)}
                        >
                          {s.fullName}
                        </button>
                      </td>
                      <td className="px-4 py-3">{s.trainingDays}</td>
                      <td className="px-4 py-3 text-emerald-700">{s.present}</td>
                      <td className="px-4 py-3 text-red-600">{s.absent}</td>
                      <td className="px-4 py-3 text-amber-700">{s.leave ?? 0}</td>
                      <td className="px-4 py-3 font-semibold">{s.attendanceRate}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h4 className="text-sm font-bold text-ink">Date-wise Attendance</h4>
              <p className="text-xs text-muted">Unmarked days are counted as Absent. Present and Absent are both included in Excel export.</p>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Registration No.</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit ? <th className="px-4 py-3">Mark</th> : null}
                  <th className="px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-8 text-center text-muted">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const studentId = r.student?.id || r.studentId;
                    const rowKey = `${studentId}_${r.date}`;
                    return (
                      <tr key={r.id || rowKey} className="border-t border-slate-100">
                        <td className="px-4 py-3">{formatDate(r.date)}</td>
                        <td className="px-4 py-3 font-medium">{r.registrationId}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="text-left text-brand hover:underline"
                            onClick={() => openStudentHistory(studentId)}
                          >
                            {r.student?.fullName || r.studentName || '—'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceStatusBadge status={r.status || r.statusLabel} />
                        </td>
                        {canEdit ? (
                          <td className="px-4 py-3">
                            <MarkStatusSelect
                              statusKey={r.statusKey || r.status}
                              busy={markingKey === rowKey}
                              onChange={(status) => handleMarkStatus(r, status)}
                            />
                          </td>
                        ) : null}
                        <td className="px-4 py-3">{r.checkIn ? r.checkIn : formatTime(r.markedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => loadRecords(p)}
            onLimitChange={(limit) => {
              setPagination((prev) => ({ ...prev, limit }));
            }}
          />
        </div>
      )}

      {historyOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-ink">
                  {historyData?.student?.fullName || 'Student'} — Attendance History
                </h3>
                <p className="text-xs text-muted">{historyData?.student?.registrationId}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                onClick={() => setHistoryOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {historyLoading ? (
                <p className="text-sm text-muted">Loading…</p>
              ) : historyData ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="text-xs text-muted">Training Days</p>
                      <p className="font-bold">{historyData.summary?.trainingDays ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="text-xs text-muted">Present</p>
                      <p className="font-bold text-emerald-700">{historyData.summary?.presentDays ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="text-xs text-muted">Absent</p>
                      <p className="font-bold text-red-600">{historyData.summary?.absentDays ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="text-xs text-muted">Leave</p>
                      <p className="font-bold text-amber-700">{historyData.summary?.leaveDays ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-surface p-3 text-sm">
                      <p className="text-xs text-muted">Attendance %</p>
                      <p className="font-bold">{historyData.summary?.attendancePercentage ?? 0}%</p>
                    </div>
                  </div>
                  <AttendanceStatusLegend className="mb-3" />
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-surface text-xs uppercase text-muted">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(historyData.history || []).map((h) => (
                        <tr key={`${h.date}-${h.statusKey || h.status}`} className="border-t border-slate-100">
                          <td className="px-3 py-2">{formatDate(h.date)}</td>
                          <td className="px-3 py-2">
                            <AttendanceStatusBadge status={h.statusKey || h.status} />
                          </td>
                          <td className="px-3 py-2">{h.checkIn || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-sm text-muted">No history found.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
