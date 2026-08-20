import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { attendanceService, authService, playerPortalService } from '../services';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';
import AttendanceStatusBadge, { AttendanceStatusLegend } from '../components/ui/AttendanceStatusBadge';
import MedalBadge from '../components/ui/MedalBadge';

export default function StudentDashboard() {
  const { user, loading, logout, isStudent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [achievements, setAchievements] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [p, a, ach, t] = await Promise.all([
        attendanceService.myProfile(),
        attendanceService.myAttendance(),
        playerPortalService.myAchievements(),
        playerPortalService.myTournaments(),
      ]);
      setProfile(p.data?.data?.student || null);
      setAttendance({
        summary: a.data?.data?.summary || null,
        records: a.data?.data?.records || [],
      });
      setAchievements(ach.data?.data?.achievements || []);
      setTournaments(t.data?.data?.results || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load student data'));
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isStudent) loadData();
  }, [user, isStudent, loadData]);

  if (loading) return <PageLoader message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStudent) {
    if (user.isCoach || user.accountType === 'coach' || user.coachId) return <Navigate to="/coach" replace />;
    if (user.isParent || user.accountType === 'parent' || user.role === 'parent') {
      return <Navigate to="/parent" replace />;
    }
    if (user.canAccessAdmin || user.isSuperAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const student = profile || user.student || {};
  const summary = attendance.summary || {};

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Logo />
            <p className="mt-0.5 text-xs font-medium text-muted">Player Panel</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-lg px-3 py-2 text-sm"
            onClick={async () => {
              await logout();
              navigate('/login?portal=player');
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
              src={mediaUrl(student.photo || user.profileImage)}
              alt={student.fullName || user.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{student.fullName || user.name}</p>
              <p className="truncate text-xs text-muted">{student.registrationNumber || user.username}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Role: Player</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'profile', label: 'Profile' },
              { id: 'attendance', label: 'My Attendance' },
              { id: 'achievements', label: 'My Achievements' },
              { id: 'tournaments', label: 'My Tournaments' },
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

        <main className="min-w-0">
          {dataLoading ? <p className="text-sm text-muted">Loading your data…</p> : null}

          {section === 'dashboard' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#FFF8F0] to-white p-5">
                <h1 className="text-xl font-bold text-ink sm:text-2xl">Welcome, {student.fullName || user.name}</h1>
                <p className="mt-1 text-sm text-muted">
                  Registration: <span className="font-semibold text-ink">{student.registrationNumber}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Training Days</p>
                  <p className="mt-1 text-xl font-bold text-ink">{summary.totalDays ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Present</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{summary.present ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Absent</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{summary.absent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Leave</p>
                  <p className="mt-1 text-xl font-bold text-amber-700">{summary.leave ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Medical / Comp.</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {summary.medicalLeave ?? 0} / {summary.competitionLeave ?? 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Attendance %</p>
                  <p className="mt-1 text-xl font-bold text-ink">{summary.attendanceRate ?? 0}%</p>
                </div>
              </div>
            </div>
          ) : null}

          {section === 'attendance' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">My Attendance</h2>
              <p className="text-xs text-muted">Monthly summary for the current training month.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Training Days</p>
                  <p className="mt-1 text-xl font-bold">{summary.totalDays ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Present</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{summary.present ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Absent</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{summary.absent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Leave</p>
                  <p className="mt-1 text-xl font-bold text-amber-700">{summary.leave ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Medical Leave</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">{summary.medicalLeave ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Competition Leave</p>
                  <p className="mt-1 text-xl font-bold text-orange-700">{summary.competitionLeave ?? 0}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-xs text-muted">Attendance %</p>
                <p className="mt-1 text-2xl font-bold text-ink">{summary.attendanceRate ?? 0}%</p>
                <p className="mt-1 text-xs text-muted">
                  Present ÷ (Present + Absent). Leave types are excused and excluded from the percentage.
                </p>
              </div>
              <AttendanceStatusLegend />
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted">
                          No attendance records for this month yet.
                        </td>
                      </tr>
                    ) : (
                      attendance.records.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">{r.date}</td>
                          <td className="px-4 py-3">
                            <AttendanceStatusBadge status={r.status || r.statusLabel} />
                          </td>
                          <td className="px-4 py-3">{r.time || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'profile' ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-4">
                <img src={mediaUrl(student.photo)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-ink">{student.fullName}</h2>
                  <p className="text-sm text-muted">{student.registrationNumber}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    <FaUser /> Player
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Registration Number', student.registrationNumber],
                  ['Date of Birth', student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : ''],
                  ['Father Name', student.fatherName],
                  ['Mother Name', student.motherName],
                  ['Mobile', student.mobileNumber],
                  ['Email', student.email],
                  ['Weight (kg)', student.weightKg],
                  ['Batch', student.batch],
                  ['Membership', student.membershipType],
                  ['Training Level', student.trainingLevel],
                  ['Status', student.status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-100 p-3">
                    <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{value || '—'}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {section === 'achievements' ? (
            !achievements.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted">
                No achievements recorded for you yet.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {achievements.map((item) => (
                  <article key={item._id || item.id} className="rounded-xl border border-slate-100 bg-white p-4">
                    {item.image ? (
                      <div className="relative mb-3 overflow-hidden rounded-lg">
                        <img src={mediaUrl(item.image)} alt="" className="h-36 w-full object-cover" />
                        <MedalBadge medal={item.medal} size="sm" />
                      </div>
                    ) : item.medal ? (
                      <div className="mb-3">
                        <MedalBadge medal={item.medal} position="inline" size="sm" />
                      </div>
                    ) : null}
                    <h3 className="font-bold text-ink">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {[item.tournamentName, item.result].filter(Boolean).join(' · ')}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {item.achievedOn
                        ? new Date(item.achievedOn).toLocaleDateString()
                        : item.year || ''}
                    </p>
                  </article>
                ))}
              </div>
            )
          ) : null}

          {section === 'tournaments' ? (
            !tournaments.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted">
                No tournament records yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.map((item) => (
                  <article key={item._id || item.id} className="rounded-xl border border-slate-100 bg-white p-4">
                    <h3 className="font-bold text-ink">{item.tournament?.name || 'Tournament'}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.tournament?.eventDate
                        ? new Date(item.tournament.eventDate).toLocaleDateString()
                        : '—'}
                      {item.tournament?.location ? ` · ${item.tournament.location}` : ''}
                    </p>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-muted">Category</dt>
                        <dd className="font-medium">{item.category || item.tournament?.category || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Result</dt>
                        <dd className="font-medium">{item.result || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Position</dt>
                        <dd className="font-medium">{item.position || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Medal</dt>
                        <dd className="font-medium">{item.medal || '—'}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            )
          ) : null}

          {section === 'password' ? (
            <form
              onSubmit={async (e) => {
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
              }}
              className="rounded-xl border border-slate-100 bg-white p-5"
            >
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
