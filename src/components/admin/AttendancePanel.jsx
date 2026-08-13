import { useCallback, useEffect, useState } from 'react';
import {
  FaCheck,
  FaDownload,
  FaExpand,
  FaQrcode,
  FaTimes,
  FaUserCheck,
  FaUserTimes,
  FaUsers,
} from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
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
import { ATTENDANCE_STATUSES } from '../../utils/attendanceStatus';
import AttendanceStatusBadge, {
  AttendanceStatusCount,
  AttendanceStatusLegend,
} from '../ui/AttendanceStatusBadge';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(value) {
  if (value === null || value === undefined || value === '' || value === 0 || value === '0' || value === '—') return 0;
  if (typeof value === 'string' && value.includes(':') && !value.includes('T')) return value;
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) return 0;
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
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
  return `raghunandan_akhada_attendance_${stamp}${suffix}.xlsx`;
}

export default function AttendancePanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = can('attendance.view') || canModule('attendance');
  const canCreate = can('attendance.create');
  const canEdit = can('attendance.edit');
  const canExport = can('attendance.export');

  const [tab, setTab] = useState('qr');
  const [session, setSession] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all'); // all | QR | BIOMETRIC
  const [locationFilter, setLocationFilter] = useState('all'); // all | verified | not_verified
  const [periodMode, setPeriodMode] = useState('month'); // month | select | custom | all
  const [selectedMonth, setSelectedMonth] = useState(''); // YYYY-MM
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
  const [closeConfirm, setCloseConfirm] = useState({ open: false, loading: false });
  const [fullscreen, setFullscreen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [markingKey, setMarkingKey] = useState('');

  const periodParams = useCallback(() => {
    const params = {
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      method: methodFilter !== 'all' ? methodFilter : undefined,
      location: locationFilter !== 'all' ? locationFilter : undefined,
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
  }, [periodMode, selectedMonth, from, to, search, statusFilter, methodFilter, locationFilter]);

  const loadActiveQr = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setQrLoading(true);
    try {
      const res = await attendanceService.activeQr();
      const next = res.data?.data?.session || null;
      setSession((prev) => {
        if (prev?.id === next?.id && prev?.status === next?.status && prev?.qrDataUrl === next?.qrDataUrl) {
          return prev;
        }
        return next;
      });
    } catch (err) {
      if (!silent) setError(getApiErrorMessage(err, 'Failed to load QR session'));
    } finally {
      if (!silent) setQrLoading(false);
    }
  }, []);

  // Real-time QR refresh via polling (new QR after each successful student scan)
  useEffect(() => {
    if (!canView || tab !== 'qr') return undefined;
    const id = setInterval(() => {
      loadActiveQr({ silent: true });
    }, 1500);
    return () => clearInterval(id);
  }, [canView, tab, loadActiveQr]);

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
    [periodParams, periodMode, selectedMonth, from, to, pagination.limit, statusFilter]
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
    if (!canView || tab !== 'records') return;
    loadRecords(1);
  }, [pagination.limit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canView) return;
    loadActiveQr();
  }, [canView, loadActiveQr]);

  useEffect(() => {
    if (!canView) return;
    loadStats();
  }, [canView, loadStats]);

  useEffect(() => {
    if (!canView || tab !== 'records') return;
    loadMonths();
  }, [canView, tab, loadMonths]);

  useEffect(() => {
    if (!canView || tab !== 'records') return;
    loadRecords(1);
  }, [canView, tab, periodMode, selectedMonth, from, to, statusFilter, methodFilter, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    if (!canCreate) {
      toast.error('You do not have permission to generate QR');
      return;
    }
    setActionLoading(true);
    try {
      const res = await attendanceService.generateQr();
      setSession(res.data?.data?.session || null);
      toast.success('New attendance QR generated');
      setTab('qr');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate QR'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!canEdit) {
      toast.error('You do not have permission to close QR');
      return;
    }
    setCloseConfirm((s) => ({ ...s, loading: true }));
    try {
      await attendanceService.closeQr(session?.id);
      toast.success('Attendance QR closed');
      setSession(null);
      setCloseConfirm({ open: false, loading: false });
      setFullscreen(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to close QR'));
      setCloseConfirm((s) => ({ ...s, loading: false }));
    }
  };

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
    if (!studentId || !row.date || !status) return;
    const key = `${studentId}_${row.date}`;
    setMarkingKey(key);
    try {
      await attendanceService.markStatus({ studentId, date: row.date, status });
      toast.success('Attendance status updated');
      await Promise.all([loadRecords(pagination.page), loadStats()]);
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

  const qrBlock = (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">Kuldeep Malik Sports Academy</p>
      <h3 className="mt-2 text-2xl font-bold text-ink">Attendance</h3>
      {qrLoading ? (
        <p className="mt-8 text-sm text-muted">Loading QR…</p>
      ) : session?.qrDataUrl ? (
        <>
          <img src={session.qrDataUrl} alt="Attendance QR" className="mx-auto mt-6 w-64 max-w-full rounded-xl border border-slate-100" />
          <p className="mt-4 text-sm font-medium text-ink">Scan to Mark Attendance</p>
          <p className="mt-2 text-xs text-muted">Session: {session.sessionCode}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Status: {session.status}</p>
          <p className="mt-1 text-xs text-muted">
            One-time QR · expires in ~{session.ttlSeconds || 60}s if unused
          </p>
          <p className="mt-1 text-xs text-muted">
            Expires: {formatTime(session.expiresAt)} · {formatDate(session.expiresAt)}
          </p>
        </>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-slate-200 bg-surface px-4 py-10">
          <FaQrcode className="mx-auto text-4xl text-slate-300" />
          <p className="mt-3 text-sm text-muted">No active attendance QR is available.</p>
          <p className="mt-1 text-xs text-muted">Click Generate QR to create one.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <FormErrorBanner message={error} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Player Attendance</h2>
          <p className="mt-0.5 text-sm text-muted">Mark status, review records, and download reports.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted">Today&apos;s date</span>
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
              onClick={() => setTab('qr')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === 'qr' ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-white'
              }`}
            >
              QR Session
            </button>
            <button
              type="button"
              onClick={() => setTab('records')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                tab === 'records' ? 'bg-brand text-white shadow-sm' : 'text-ink hover:bg-white'
              }`}
            >
              Records
            </button>
          </div>
        </div>
      </div>

      {tab === 'qr' ? (
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-ink">Today at a glance</h3>
            <AttendanceStatusLegend />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Players" value={stats?.totalStudents ?? 0} icon={FaUsers} loading={statsLoading} />
            <StatCard label="Present" value={stats?.present ?? 0} icon={FaUserCheck} loading={statsLoading} />
            <StatCard label="Absent" value={stats?.absent ?? 0} icon={FaUserTimes} loading={statsLoading} />
            <StatCard
              label="Attendance %"
              value={stats ? `${stats.attendanceRate ?? 0}%` : '0%'}
              icon={FaCheck}
              loading={statsLoading}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <AttendanceStatusCount statusKey="present" label="Present" value={stats?.present ?? 0} loading={statsLoading} />
            <AttendanceStatusCount statusKey="absent" label="Absent" value={stats?.absent ?? 0} loading={statsLoading} />
            <AttendanceStatusCount statusKey="leave" label="Leave" value={stats?.leave ?? 0} loading={statsLoading} />
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
      ) : null}

      {tab === 'qr' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {canCreate ? (
              <Button onClick={handleGenerate} disabled={actionLoading} className="rounded-lg">
                <FaQrcode className="mr-2" />
                {session ? 'Generate New QR' : 'Generate QR'}
              </Button>
            ) : null}
            {canEdit && session?.status === 'ACTIVE' ? (
              <Button
                variant="secondary"
                onClick={() => setCloseConfirm({ open: true, loading: false })}
                className="rounded-lg"
              >
                <FaTimes className="mr-2" />
                Close QR
              </Button>
            ) : null}
            {session?.qrDataUrl ? (
              <Button variant="secondary" onClick={() => setFullscreen(true)} className="rounded-lg">
                <FaExpand className="mr-2" />
                Fullscreen
              </Button>
            ) : null}
          </div>
          {qrBlock}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink">Attendance Records</h3>
                <p className="mt-0.5 text-xs text-muted">Filter by period, player, and status</p>
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
                <span className="mb-1 block text-xs text-muted">Search player</span>
                <SearchBar value={search} onChange={setSearch} placeholder="Name / Reg ID / Father Name" />
              </div>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">Status</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  {ATTENDANCE_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">Source</span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="QR">QR</option>
                  <option value="BIOMETRIC">Biometric</option>
                </select>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs text-muted">Location</span>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="all">All</option>
                  <option value="verified">Verified</option>
                  <option value="not_verified">Not Verified</option>
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
              <div className="flex min-w-[10rem] flex-col justify-center rounded-xl border border-brand/15 bg-gradient-to-br from-[#FFF8F0] to-white px-5 py-4 lg:w-44">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Attendance %</p>
                <p className="mt-1 text-4xl font-bold tabular-nums text-ink">
                  {recordsLoading
                    ? '…'
                    : `${recordsSummary?.attendancePercentage ?? recordsSummary?.attendanceRate ?? 0}%`}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-muted">
                  Present ÷ (Present + Absent). Leave types are excused.
                </p>
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>
                      <span className="font-semibold text-ink">{recordsSummary?.totalStudents ?? 0}</span> players
                    </span>
                    <span>
                      <span className="font-semibold text-ink">{recordsSummary?.trainingDays ?? 0}</span> training
                      days
                    </span>
                  </div>
                  <AttendanceStatusLegend />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                    value={
                      recordsSummary?.competitionLeaveStudentDays ?? recordsSummary?.competitionLeave ?? 0
                    }
                    loading={recordsLoading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <h4 className="text-sm font-bold text-ink">Player Attendance Summary</h4>
              <p className="text-xs text-muted">
                Based on scheduled Academy training days (joining date respected; future days excluded)
              </p>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Registration ID</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Training Days</th>
                  <th className="px-4 py-3">Present</th>
                  <th className="px-4 py-3">Absent</th>
                  <th className="px-4 py-3">Leave</th>
                  <th className="px-4 py-3">Medical</th>
                  <th className="px-4 py-3">Competition</th>
                  <th className="px-4 py-3">%</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : studentSummary.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-6 text-center text-muted">
                      No player summary for this period.
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
                      <td className="px-4 py-3 text-purple-700">{s.medicalLeave ?? 0}</td>
                      <td className="px-4 py-3 text-orange-700">{s.competitionLeave ?? 0}</td>
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
              <p className="text-xs text-muted">
                All active players for each training day — unmarked = Absent. Use Status to mark leave types.
              </p>
            </div>
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Registration ID</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3">Father</th>
                  <th className="px-4 py-3">Status</th>
                  {canEdit ? <th className="px-4 py-3">Mark / Edit</th> : null}
                  <th className="px-4 py-3">Check-in</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Distance</th>
                  <th className="px-4 py-3">Location</th>
                </tr>
              </thead>
              <tbody>
                {recordsLoading ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="px-4 py-8 text-center text-muted">
                      Loading…
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 10 : 9} className="px-4 py-8 text-center text-muted">
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => {
                    const studentId = r.student?.id || r.studentId;
                    const rowKey = `${studentId}_${r.date}`;
                    const isPresent = r.status === 'present';
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
                            {r.student?.fullName || '—'}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted">{r.student?.fatherName || '—'}</td>
                        <td className="px-4 py-3">
                          <AttendanceStatusBadge status={r.status || r.statusLabel} />
                        </td>
                        {canEdit ? (
                          <td className="px-4 py-3">
                            <select
                              className="max-w-[11rem] rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                              value={r.status || 'absent'}
                              disabled={markingKey === rowKey}
                              onChange={(e) => handleMarkStatus(r, e.target.value)}
                            >
                              {ATTENDANCE_STATUSES.map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        ) : null}
                        <td className="px-4 py-3">{r.checkIn ? r.checkIn : formatTime(r.markedAt)}</td>
                        <td className="px-4 py-3">{isPresent ? r.sourceLabel || r.method || 'QR' : r.sourceLabel || '—'}</td>
                        <td className="px-4 py-3">{r.distanceLabel || '—'}</td>
                        <td className="px-4 py-3">{r.locationLabel || '—'}</td>
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

      <ConfirmDialog
        open={closeConfirm.open}
        loading={closeConfirm.loading}
        title="Close attendance QR?"
        message="Students will no longer be able to scan this QR. You can generate a new one anytime."
        confirmLabel="Close QR"
        danger={false}
        onConfirm={handleClose}
        onCancel={() => setCloseConfirm({ open: false, loading: false })}
      />

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
                <p className="text-sm text-muted">Loadingâ€¦</p>
              ) : historyData ? (
                <>
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
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
                      <p className="text-xs text-muted">Medical / Competition</p>
                      <p className="font-bold text-purple-700">
                        {historyData.summary?.medicalLeaveDays ?? 0} / {historyData.summary?.competitionLeaveDays ?? 0}
                      </p>
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

      {fullscreen && session?.qrDataUrl ? (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white p-6">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="absolute right-4 top-4 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold"
          >
            Exit Fullscreen
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand">Kuldeep Malik Sports Academy</p>
          <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Attendance</h2>
          <img src={session.qrDataUrl} alt="Attendance QR" className="mt-8 w-[min(70vw,420px)]" />
          <p className="mt-6 text-lg font-medium text-ink">Scan to Mark Attendance</p>
          <p className="mt-2 text-sm text-muted">Session: {session.sessionCode} · {session.status}</p>
        </div>
      ) : null}
    </div>
  );
}
