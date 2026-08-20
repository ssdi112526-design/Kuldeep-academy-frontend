import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService, coachPortalService } from '../services';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';

export default function CoachDashboard() {
  const { user, loading, logout, isCoach } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [p, a] = await Promise.all([coachPortalService.myProfile(), coachPortalService.myAttendance()]);
      setProfile(p.data?.data?.coach || null);
      setAttendance({
        summary: a.data?.data?.summary || null,
        records: a.data?.data?.records || [],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load coach data'));
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isCoach) loadData();
  }, [user, isCoach, loadData]);

  if (loading) return <PageLoader message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isCoach) {
    if (user.isStudent) return <Navigate to="/student" replace />;
    if (user.canAccessAdmin || user.isSuperAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const coach = profile || user.coach || {};
  const summary = attendance.summary || {};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPwdSaving(true);
    try {
      await authService.changePassword(pwdForm);
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password'));
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Logo />
            <p className="mt-0.5 text-xs font-medium text-muted">Coach Dashboard</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-lg px-3 py-2 text-sm"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <img
              src={mediaUrl(coach.photo || user.profileImage)}
              alt={coach.fullName || user.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{coach.fullName || user.name}</p>
              <p className="truncate text-xs text-muted">{coach.coachCode || user.username}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Role: Coach</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'attendance', label: 'My Attendance' },
              { id: 'profile', label: 'My Profile' },
              { id: 'password', label: 'Change Password' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSection(item.id);
                }}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                  section === item.id ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <Link to="/" className="mt-4 block px-3 text-sm text-brand hover:underline">
            ← Website
          </Link>
        </aside>

        <main className="min-w-0 space-y-5">
          {dataLoading ? <PageLoader message="Loading your data…" /> : null}

          {!dataLoading && section === 'dashboard' ? (
            <>
              <div className="rounded-xl border border-slate-100 bg-white p-5">
                <h1 className="text-xl font-bold text-ink">Welcome, {coach.fullName || user.name}</h1>
                <p className="mt-1 text-sm text-muted">
                  View your attendance history. Attendance is marked by academy staff.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Training Days', value: summary.trainingDays ?? summary.totalDays ?? 0 },
                  { label: 'Present', value: summary.presentDays ?? summary.present ?? 0 },
                  { label: 'Absent', value: summary.absentDays ?? summary.absent ?? 0 },
                  { label: 'Attendance %', value: `${summary.attendancePercentage ?? summary.attendanceRate ?? 0}%` },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">{card.label}</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{card.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {!dataLoading && section === 'attendance' ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5">
              <h2 className="text-lg font-bold text-ink">My Attendance</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <p className="text-sm text-muted">
                  Total Days: <span className="font-semibold text-ink">{summary.trainingDays ?? 0}</span>
                </p>
                <p className="text-sm text-muted">
                  Present: <span className="font-semibold text-ink">{summary.presentDays ?? 0}</span>
                </p>
                <p className="text-sm text-muted">
                  Absent: <span className="font-semibold text-ink">{summary.absentDays ?? 0}</span>
                </p>
                <p className="text-sm text-muted">
                  Attendance:{' '}
                  <span className="font-semibold text-ink">{summary.attendancePercentage ?? 0}%</span>
                </p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(attendance.records || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-muted">
                          No attendance records yet. Academy staff mark attendance for you.
                        </td>
                      </tr>
                    ) : (
                      (attendance.records || []).map((r) => (
                        <tr key={r.id || r.date} className="border-t border-slate-100">
                          <td className="px-3 py-2">{formatDate(r.date)}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                r.status === 'Present'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-red-50 text-red-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{r.time || r.checkIn || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {!dataLoading && section === 'profile' ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5">
              <h2 className="text-lg font-bold text-ink">My Profile</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  ['Coach ID', coach.coachCode],
                  ['Full Name', coach.fullName],
                  ['Father Name', coach.fatherName],
                  ['Mobile', coach.mobile],
                  ['Email', coach.email],
                  ['Username', coach.username || user.username],
                  ['Specialization', coach.specialization],
                  ['Status', coach.status],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{value || 0}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {section === 'password' ? (
            <form onSubmit={handleChangePassword} className="rounded-xl border border-slate-100 bg-white p-5">
              <h2 className="text-lg font-bold text-ink">Change Password</h2>
              <p className="mt-1 text-sm text-muted">Current password is required to set a new one.</p>
              <div className="mt-4 max-w-md space-y-3">
                <label className="block text-sm font-medium">
                  Current Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="8+ chars, upper, lower, number"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Confirm New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <Button type="submit" disabled={pwdSaving}>
                  {pwdSaving ? 'Saving…' : 'Change Password'}
                </Button>
              </div>
            </form>
          ) : null}
        </main>
      </div>
    </div>
  );
}
