import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parentPortalService } from '../services';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';
import AttendanceStatusBadge, { AttendanceStatusLegend } from '../components/ui/AttendanceStatusBadge';
import MedalBadge from '../components/ui/MedalBadge';

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profile' },
  { id: 'child', label: 'My Child / Player' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'tournaments', label: 'Tournament Records' },
];

export default function ParentDashboard() {
  const { user, loading, logout, isParent, isStudent, isCoach, canAccessAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState('dashboard');
  const [parent, setParent] = useState(null);
  const [childId, setChildId] = useState('');
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [achievements, setAchievements] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const children = useMemo(() => parent?.children || [], [parent]);
  const activeChild = children.find((c) => (c._id || c.id) === childId) || children[0] || null;

  const loadParent = useCallback(async () => {
    setDataLoading(true);
    try {
      const res = await parentPortalService.me();
      const data = res.data?.data?.parent || null;
      setParent(data);
      const first = data?.children?.[0];
      if (first) setChildId(first._id || first.id);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load parent profile'));
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  const loadChildData = useCallback(
    async (studentId) => {
      if (!studentId) return;
      setDetailLoading(true);
      try {
        const [a, ach, t] = await Promise.all([
          parentPortalService.childAttendance(studentId),
          parentPortalService.childAchievements(studentId),
          parentPortalService.childTournaments(studentId),
        ]);
        setAttendance({
          summary: a.data?.data?.summary || null,
          records: a.data?.data?.records || [],
        });
        setAchievements(ach.data?.data?.achievements || []);
        setTournaments(t.data?.data?.results || []);
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to load child data'));
      } finally {
        setDetailLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (user && isParent) loadParent();
  }, [user, isParent, loadParent]);

  useEffect(() => {
    if (activeChild) loadChildData(activeChild._id || activeChild.id);
  }, [activeChild, loadChildData]);

  if (loading) return <PageLoader message="Loading parent panel…" />;
  if (!user) return <Navigate to="/login?portal=parent" replace />;
  if (isStudent) return <Navigate to="/student" replace />;
  if (isCoach) return <Navigate to="/coach" replace />;
  if (canAccessAdmin) return <Navigate to="/admin" replace />;
  if (!isParent) return <Navigate to="/" replace />;

  const summary = attendance.summary || {};

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Logo />
            <p className="mt-0.5 text-xs font-medium text-muted">Parent Panel</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-lg px-3 py-2 text-sm"
            onClick={async () => {
              await logout();
              navigate('/login?portal=parent');
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
              src={mediaUrl(parent?.photo || user.parentProfile?.photo || user.profileImage)}
              alt={parent?.fullName || user.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{parent?.fullName || user.name}</p>
              <p className="truncate text-xs text-muted">{parent?.email || user.email}</p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-brand">Role: Parent</p>
            </div>
          </div>

          {children.length > 1 ? (
            <label className="mb-3 block text-xs font-medium text-muted">
              Viewing child
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-ink"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
              >
                {children.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
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
          {dataLoading || detailLoading ? <p className="mb-3 text-sm text-muted">Loading…</p> : null}

          {section === 'dashboard' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#FFF8F0] to-white p-5">
                <h1 className="text-xl font-bold text-ink">Welcome, {parent?.fullName || user.name}</h1>
                <p className="mt-1 text-sm text-muted">
                  Monitor your linked player&apos;s attendance, achievements and tournament records.
                </p>
              </div>
              {activeChild ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-muted">Player</p>
                    <p className="mt-1 truncate font-bold text-ink">{activeChild.fullName}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-muted">Attendance %</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{summary.percent ?? activeChild.attendancePercent ?? 0}%</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-muted">Present</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{summary.present ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-white p-4">
                    <p className="text-xs text-muted">Achievements</p>
                    <p className="mt-1 text-2xl font-bold text-ink">{achievements.length}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted">
                  No linked player yet. Contact the academy admin.
                </div>
              )}
            </div>
          ) : null}

          {section === 'profile' ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5">
              <h2 className="text-lg font-bold text-ink">Parent Profile</h2>
              <div className="mt-4 flex items-center gap-4">
                <img
                  src={mediaUrl(parent?.photo || user.parentProfile?.photo || user.profileImage)}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div>
                  <p className="font-bold text-ink">{parent?.fullName || user.name}</p>
                  <p className="text-sm text-muted">{parent?.relation || 'Parent'}</p>
                </div>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted">Name</dt>
                  <dd className="font-medium text-ink">{parent?.fullName || user.name}</dd>
                </div>
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd className="font-medium text-ink">{parent?.email || user.email}</dd>
                </div>
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd className="font-medium text-ink">{parent?.phone || user.mobile || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Relation</dt>
                  <dd className="font-medium text-ink">{parent?.relation || 'Parent'}</dd>
                </div>
              </dl>
            </div>
          ) : null}

          {section === 'child' ? (
            activeChild ? (
              <div className="rounded-xl border border-slate-100 bg-white p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={mediaUrl(activeChild.photo)}
                    alt={activeChild.fullName}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-ink">{activeChild.fullName}</h2>
                    <p className="text-sm text-muted">{activeChild.registrationNumber}</p>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted">Status</dt>
                    <dd className="font-medium text-ink">{activeChild.status || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Batch</dt>
                    <dd className="font-medium text-ink">{activeChild.batch || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Membership</dt>
                    <dd className="font-medium text-ink">{activeChild.membershipType || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted">Mobile</dt>
                    <dd className="font-medium text-ink">{activeChild.mobileNumber || '—'}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <p className="text-sm text-muted">No linked player.</p>
            )
          ) : null}

          {section === 'attendance' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">Child Attendance</h2>
              <p className="text-xs text-muted">
                Showing attendance for {activeChild?.fullName || 'your linked player'} only (current month).
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Training Days</p>
                  <p className="mt-1 text-2xl font-bold text-ink">{summary.total ?? summary.trainingDays ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Present</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.present ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Absent</p>
                  <p className="mt-1 text-2xl font-bold text-red-600">{summary.absent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Leave</p>
                  <p className="mt-1 text-2xl font-bold text-amber-700">{summary.leave ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Medical Leave</p>
                  <p className="mt-1 text-2xl font-bold text-purple-700">{summary.medicalLeave ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Competition Leave</p>
                  <p className="mt-1 text-2xl font-bold text-orange-700">{summary.competitionLeave ?? 0}</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-xs text-muted">Attendance %</p>
                <p className="mt-1 text-2xl font-bold text-ink">{summary.percent ?? summary.attendancePercentage ?? 0}%</p>
                <p className="mt-1 text-xs text-muted">
                  Present ÷ (Present + Absent). Leave types are excused and excluded from the percentage.
                </p>
              </div>
              <AttendanceStatusLegend />
              {!attendance.records.length ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted">
                  No attendance history for this player yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-muted">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.records.map((r) => (
                        <tr key={r._id || r.id} className="border-b border-slate-50">
                          <td className="px-4 py-3">
                            {r.date
                              ? new Date(`${r.date}T00:00:00Z`).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  timeZone: 'UTC',
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <AttendanceStatusBadge status={r.status || r.statusLabel} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}

          {section === 'achievements' ? (
            !achievements.length ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-muted">
                No achievements recorded for this player yet.
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
                No tournament records for this player yet.
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
                    {item.remarks ? <p className="mt-2 text-sm text-ink/80">{item.remarks}</p> : null}
                  </article>
                ))}
              </div>
            )
          ) : null}
        </main>
      </div>
    </div>
  );
}
