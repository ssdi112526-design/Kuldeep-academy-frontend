import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FaClipboardList,
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaUserLock,
  FaTrophy,
  FaBars,
  FaTimes,
  FaChartPie,
  FaHistory,
  FaReceipt,
  FaMoneyCheckAlt,
  FaExclamationCircle,
  FaMedal,
  FaChartBar,
  FaUserFriends,
  FaTools,
  FaImages,
  FaHandshake,
  FaRunning,
  FaCrown,
  FaBook,
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { cmsStatsService } from '../services';
import StatCard from '../components/admin/StatCard';
import EntryStudentsPanel from '../components/admin/EntryStudentsPanel';
import EntryCoachesPanel from '../components/admin/EntryCoachesPanel';
import UsersPanel from '../components/admin/UsersPanel';
import RolesPanel from '../components/admin/RolesPanel';
import AllRecordsPanel from '../components/admin/AllRecordsPanel';
import CoachAttendancePanel from '../components/admin/CoachAttendancePanel';
import FinanceDashboardPanel from '../components/admin/FinanceDashboardPanel';
import StudentFeesPanel from '../components/admin/StudentFeesPanel';
import CollectFeesPanel from '../components/admin/CollectFeesPanel';
import PendingFeesPanel from '../components/admin/PendingFeesPanel';
import CoachPaymentsPanel from '../components/admin/CoachPaymentsPanel';
import PaymentHistoryPanel from '../components/admin/PaymentHistoryPanel';
import ReceiptsPanel from '../components/admin/ReceiptsPanel';
import PlayerAchievementsPanel from '../components/admin/PlayerAchievementsPanel';
import TournamentRecordsPanel from '../components/admin/TournamentRecordsPanel';
import ReportsHubPanel from '../components/admin/ReportsHubPanel';
import ParentsPanel from '../components/admin/ParentsPanel';
import EntryEquipmentPanel from '../components/admin/EntryEquipmentPanel';
import GalleryPanel from '../components/admin/GalleryPanel';
import AthletesPanel from '../components/admin/AthletesPanel';
import LegacyMembersPanel from '../components/admin/LegacyMembersPanel';
import SponsorshipsPanel from '../components/admin/SponsorshipsPanel';
import AccessDenied from '../components/admin/AccessDenied';
import GlobalSearch from '../components/admin/GlobalSearch';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: FaClipboardList, module: 'dashboard', permission: 'dashboard.view' },
  {
    id: 'players-menu',
    label: 'Players',
    children: [
      { id: 'students', label: 'All Players', icon: FaUsers, module: 'students', permission: 'students.view' },
      {
        id: 'all-records',
        label: 'All Records',
        icon: FaBook,
        module: 'attendance',
        permission: 'attendance.view',
      },
      { id: 'parents', label: 'Parent Accounts', icon: FaUserFriends, module: 'students', permission: 'students.view' },
      { id: 'coaches', label: 'Employees', icon: FaUserTie, module: 'coaches', permission: 'coaches.view' },
      { id: 'gallery', label: 'Gallery', icon: FaImages, module: 'gallery', permission: 'gallery.view' },
      { id: 'sponsorships', label: 'Sponsorships', icon: FaHandshake, module: 'sponsorships', permission: 'sponsorships.view' },
      {
        id: 'tournaments',
        label: 'Tournament Records',
        icon: FaMedal,
        module: 'tournaments',
        permission: 'tournaments.view',
      },
      { id: 'equipment', label: 'Equipment', icon: FaTools, module: 'equipment', permission: 'equipment.view' },
      { id: 'athletes', label: 'Athletes', icon: FaRunning, module: 'athletes', permission: 'athletes.view' },
      {
        id: 'legacy-members',
        label: 'Legacy Members',
        icon: FaCrown,
        module: 'legacy_members',
        permission: 'legacy_members.view',
      },
      { id: 'reports', label: 'Reports', icon: FaChartBar, module: 'reports', permission: 'reports.view' },
    ],
  },
  {
    id: 'attendance-menu',
    label: 'Attendance',
    children: [
      { id: 'coach-attendance', label: 'Coaches', icon: FaUserTie, module: 'attendance', permission: 'attendance.view' },
    ],
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: FaTrophy,
    module: 'player_achievements',
    permission: 'player_achievements.view',
  },
  {
    id: 'fees-menu',
    label: 'Fees',
    children: [
      { id: 'finance-dashboard', label: 'Overview', icon: FaChartPie, module: 'finance', permission: 'finance.view' },
      { id: 'student-fees', label: 'Player Fees', icon: FaUsers, module: 'finance', permission: 'finance.view' },
      { id: 'collect-fees', label: 'Add Payment', icon: FaMoneyCheckAlt, module: 'finance', permission: 'finance.create' },
      { id: 'pending-fees', label: 'Pending Fees', icon: FaExclamationCircle, module: 'finance', permission: 'finance.view' },
      { id: 'payment-history', label: 'Payment History', icon: FaHistory, module: 'finance', permission: 'finance.view' },
      { id: 'receipts', label: 'Receipts', icon: FaReceipt, module: 'finance', permission: 'finance.view' },
      { id: 'coach-payments', label: 'Employee Payments', icon: FaUserTie, module: 'finance', permission: 'finance.view' },
    ],
  },
  {
    id: 'user-mgmt',
    label: 'Access Control',
    superAdminOnly: true,
    children: [
      { id: 'users', label: 'Users', icon: FaUserShield, module: 'users', permission: 'users.view' },
      { id: 'roles', label: 'Roles & Permissions', icon: FaUserLock, module: 'roles', permission: 'roles.view' },
    ],
  },
];

const SECTION_MODULE = {
  dashboard: 'dashboard',
  students: 'students',
  'all-records': 'attendance',
  parents: 'students',
  'coach-attendance': 'attendance',
  coaches: 'coaches',
  achievements: 'player_achievements',
  'finance-dashboard': 'finance',
  'student-fees': 'finance',
  'collect-fees': 'finance',
  'pending-fees': 'finance',
  'coach-payments': 'finance',
  'payment-history': 'finance',
  receipts: 'finance',
  sponsorships: 'sponsorships',
  reports: 'reports',
  tournaments: 'tournaments',
  equipment: 'equipment',
  athletes: 'athletes',
  'legacy-members': 'legacy_members',
  gallery: 'gallery',
  users: 'users',
  roles: 'roles',
};

function NavItems({ items, section, onSelect }) {
  return items.map((item) =>
    item.children ? (
      <div key={item.id} className="mt-2">
        <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{item.label}</p>
        {item.children.map((child) => {
          const Icon = child.icon;
          const active = section === child.id;
          return (
            <button
              key={child.id}
              type="button"
              onClick={() => onSelect(child.id)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                active ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="truncate">{child.label}</span>
            </button>
          );
        })}
      </div>
    ) : (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelect(item.id)}
        className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
          section === item.id ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
        }`}
      >
        <item.icon size={14} className="shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    ),
  );
}

export default function Admin() {
  const { user, loading, canAccessAdmin, logout, isStudent, isCoach, isParent } = useAuth();
  const { can, canModule, isSuperAdmin } = usePermissions();
  const navigate = useNavigate();
  const { sectionId: routeSection } = useParams();
  const [section, setSection] = useState(() => routeSection || 'dashboard');
  const [focusTarget, setFocusTarget] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmsStats, setCmsStats] = useState({
    totalStudents: 0,
    totalCoaches: 0,
    totalInquiries: 0,
    recentStudents: [],
    playerAchievementsTotal: 0,
    playersWithAchievements: 0,
    medals: { Gold: 0, Silver: 0, Bronze: 0, Other: 0 },
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const refreshCmsStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await cmsStatsService.get();
      setCmsStats(res.data.data);
    } catch {
      /* non-critical */
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccessAdmin && (can('dashboard.view') || canModule('dashboard') || isSuperAdmin)) refreshCmsStats();
  }, [canAccessAdmin, can, canModule, isSuperAdmin, refreshCmsStats]);

  const filteredNav = useMemo(() => {
    const canSeeItem = (item) => {
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (isSuperAdmin) return true;
      if (item.id === 'achievements' && (canModule('player_achievements') || canModule('achievements'))) return true;
      if (item.id === 'reports' && (canModule('reports') || canModule('finance') || canModule('students'))) return true;
      if (item.module && canModule(item.module)) return true;
      if (item.permission && can(item.permission)) return true;
      return false;
    };

    return NAV.map((item) => {
      if (item.children) {
        if (item.superAdminOnly && !isSuperAdmin && !canModule('users') && !canModule('roles')) {
          return null;
        }
        const children = item.children.filter((child) => canSeeItem(child));
        if (!children.length) return null;
        return { ...item, children };
      }
      if (!canSeeItem(item)) return null;
      return item;
    }).filter(Boolean);
  }, [can, canModule, isSuperAdmin]);

  useEffect(() => {
    if (!routeSection) return;
    if (SECTION_MODULE[routeSection] || routeSection === 'dashboard') {
      setSection(routeSection);
    }
  }, [routeSection]);

  useEffect(() => {
    const allowed = filteredNav.flatMap((item) => (item.children ? item.children.map((c) => c.id) : [item.id]));
    if (allowed.length && !allowed.includes(section)) {
      const next = allowed[0];
      setSection(next);
      navigate(next === 'dashboard' ? '/admin' : `/admin/${next}`, { replace: true });
    }
  }, [filteredNav, section, navigate]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mobileNavOpen]);

  if (loading) {
    return <PageLoader message="Loading admin panel..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isStudent) return <Navigate to="/student" replace />;
  if (isCoach) return <Navigate to="/coach" replace />;
  if (isParent) return <Navigate to="/parent" replace />;
  if (!canAccessAdmin && !isSuperAdmin) return <Navigate to="/" replace />;

  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Operations overview for Kuldeep Malik Sports Academy.' },
    students: { title: 'Players', subtitle: 'Manage player profiles, status, attendance and documents.' },
    'all-records': {
      title: 'All Records',
      subtitle: 'Manage daily player attendance and view player records.',
    },
    parents: { title: 'Parent Accounts', subtitle: 'Create parent logins linked to their children / players.' },
    'coach-attendance': { title: 'Coach Attendance', subtitle: 'Mark daily coach attendance and history.' },
    coaches: { title: 'Employees', subtitle: 'Manage coaches and employee profiles separately from players.' },
    achievements: { title: 'Achievements', subtitle: 'Assign medals, titles and certificates to players.' },
    'finance-dashboard': {
      title: 'Fees Overview',
      subtitle: 'Player fee collection, employee payments and balance overview.',
    },
    'student-fees': {
      title: 'Player Fees',
      subtitle: 'Monthly Fees, Hostel Fees and Other Fees — defaults, generate bills and dues.',
    },
    'collect-fees': {
      title: 'Add Payment',
      subtitle: 'Collect Monthly, Hostel or Other fees (Cash / UPI / Bank) and print receipts.',
    },
    'pending-fees': {
      title: 'Pending Fees',
      subtitle: 'Players with outstanding or partial fee balances.',
    },
    'coach-payments': {
      title: 'Employee Payments',
      subtitle: 'Record salary, bonus and deduction payments for employees.',
    },
    'payment-history': {
      title: 'Payment History',
      subtitle: 'All player fee payment transactions and receipts.',
    },
    receipts: {
      title: 'Receipts',
      subtitle: 'View and print player fee receipts.',
    },
    reports: {
      title: 'Reports',
      subtitle:
        'Akhada management reports — players, attendance, categories, tournaments, medals, fees, salary and sponsorships.',
    },
    sponsorships: {
      title: 'Sponsorships',
      subtitle: 'Manage sponsors, contracts, documents and expiry — admin only.',
    },
    tournaments: {
      title: 'Tournament Records',
      subtitle: 'Tournaments, player participation, results, positions and medals.',
    },
    equipment: {
      title: 'Equipment',
      subtitle: 'Manage akhada equipment inventory from the admin panel.',
    },
    athletes: {
      title: 'Athletes',
      subtitle: 'Upload wrestler photos for the public Meet Our Wrestlers section.',
    },
    'legacy-members': {
      title: 'Legacy Members',
      subtitle: 'Manage prestigious members shown on the public Legacy section.',
    },
    gallery: {
      title: 'Gallery',
      subtitle: 'Upload and manage gallery images for the public website.',
    },
    users: { title: 'Users', subtitle: 'Create accounts and manage staff access.' },
    roles: { title: 'Roles & Permissions', subtitle: 'Configure role-based access across the admin panel.' },
  };

  const meta = titles[section] || titles.dashboard;
  const sectionModule = SECTION_MODULE[section];
  const allowedSection =
    isSuperAdmin ||
    !sectionModule ||
    canModule(sectionModule) ||
    (section === 'achievements' && canModule('achievements')) ||
    (section === 'reports' &&
      (canModule('finance') || canModule('students') || canModule('attendance') || canModule('tournaments')));

  const selectSection = (id) => {
    setSection(id);
    setMobileNavOpen(false);
    navigate(id === 'dashboard' ? '/admin' : `/admin/${id}`);
  };

  const handleGlobalSearchSelect = (item) => {
    if (!item?.section || !item?.id) return;
    setFocusTarget({ section: item.section, id: item.id, type: item.type, at: Date.now() });
    setSection(item.section);
    setMobileNavOpen(false);
    navigate(item.section === 'dashboard' ? '/admin' : `/admin/${item.section}`);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface">
      <header className="relative z-[60] shrink-0 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:flex-nowrap">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-ink lg:hidden"
              aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <FaTimes /> : <FaBars />}
            </button>
            <div className="min-w-0 scale-90 origin-left sm:scale-100">
              <Logo />
            </div>
          </div>
          <div className="order-3 w-full min-w-0 lg:order-none lg:mx-2 lg:flex-1">
            <GlobalSearch onSelect={handleGlobalSearchSelect} />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="max-w-[180px] truncate text-xs text-muted">
                {user.roleName || user.roleSlug || user.role} · {user.email}
              </p>
            </div>
            <Link to="/" className="hidden text-sm font-medium text-brand hover:underline sm:inline">
              Website
            </Link>
            <Button
              variant="secondary"
              onClick={logout}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink shadow-sm hover:border-[#D97706]/40 hover:bg-[#F8F7F2] sm:px-4"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto flex min-h-0 w-full max-w-7xl flex-1 px-3 sm:px-6">
        {/* Mobile overlay */}
        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        {/* Sidebar / drawer */}
        <aside
          className={`fixed bottom-0 left-0 top-[57px] z-50 flex w-[min(18rem,85vw)] flex-col border-r border-slate-100 bg-white shadow-xl transition-transform duration-200 sm:top-[65px] lg:static lg:z-auto lg:w-56 lg:shrink-0 lg:border-r-0 lg:bg-transparent lg:shadow-none ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="min-h-0 flex-1 overflow-y-auto p-3 lg:sticky lg:top-0 lg:max-h-[calc(100dvh-5rem)] lg:py-8">
            <div className="rounded-xl border border-slate-100 bg-white p-3">
              <NavItems items={filteredNav} section={section} onSelect={selectSection} />
            </div>
            <Link
              to="/"
              className="mt-3 block rounded-lg px-3 py-2.5 text-sm font-medium text-brand hover:bg-brand/5 sm:hidden"
              onClick={() => setMobileNavOpen(false)}
            >
              ← Back to Website
            </Link>
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden py-4 sm:py-6 lg:py-8 lg:pl-6">
          <h1 className="text-xl font-bold text-ink sm:text-2xl">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted">{meta.subtitle}</p>

          <div className="mt-5 pb-10 sm:mt-6">
            {!allowedSection ? (
              <AccessDenied />
            ) : (
              <>
                {section === 'dashboard' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <StatCard label="Total Players" value={cmsStats.totalStudents} icon={FaUsers} loading={statsLoading} />
                      <StatCard label="Total Employees" value={cmsStats.totalCoaches} icon={FaUserTie} loading={statsLoading} />
                      <StatCard label="Open Inquiries" value={cmsStats.totalInquiries} icon={FaClipboardList} loading={statsLoading} />
                    </div>

                    <div className="rounded-xl border border-slate-100 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-ink">Achievement Summary</h3>
                        <button
                          type="button"
                          className="text-xs font-semibold text-brand hover:underline"
                          onClick={() => selectSection('achievements')}
                        >
                          View all →
                        </button>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                        <button type="button" className="rounded-lg bg-surface p-3 text-left" onClick={() => selectSection('achievements')}>
                          <p className="text-xs text-muted">Players with medals</p>
                          <p className="mt-1 text-xl font-bold text-ink">{cmsStats.playersWithAchievements ?? 0}</p>
                        </button>
                        <button type="button" className="rounded-lg bg-surface p-3 text-left" onClick={() => selectSection('achievements')}>
                          <p className="text-xs text-muted">Total achievements</p>
                          <p className="mt-1 text-xl font-bold text-ink">{cmsStats.playerAchievementsTotal ?? 0}</p>
                        </button>
                        <button type="button" className="rounded-lg bg-amber-50 p-3 text-left" onClick={() => selectSection('achievements')}>
                          <p className="text-xs text-amber-800">Gold</p>
                          <p className="mt-1 text-xl font-bold text-amber-900">{cmsStats.medals?.Gold ?? 0}</p>
                        </button>
                        <button type="button" className="rounded-lg bg-slate-100 p-3 text-left" onClick={() => selectSection('achievements')}>
                          <p className="text-xs text-slate-600">Silver</p>
                          <p className="mt-1 text-xl font-bold text-slate-800">{cmsStats.medals?.Silver ?? 0}</p>
                        </button>
                        <button type="button" className="rounded-lg bg-orange-50 p-3 text-left" onClick={() => selectSection('achievements')}>
                          <p className="text-xs text-orange-800">Bronze</p>
                          <p className="mt-1 text-xl font-bold text-orange-900">{cmsStats.medals?.Bronze ?? 0}</p>
                        </button>
                      </div>
                    </div>

                    {cmsStats.recentStudents?.length ? (
                      <div className="rounded-xl border border-slate-100 bg-white p-4">
                        <h3 className="text-sm font-bold text-ink">Recent Players</h3>
                        <ul className="mt-3 space-y-2">
                          {cmsStats.recentStudents.map((item) => (
                            <li key={item._id || item.id} className="flex items-center justify-between gap-2 text-sm">
                              <span className="truncate font-medium text-ink">{item.fullName}</span>
                              <span className="shrink-0 text-xs text-muted">
                                {item.studentCode || item.registrationNumber || ''}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}

                {section === 'students' && (
                  <EntryStudentsPanel
                    focusId={focusTarget?.section === 'students' ? focusTarget.id : null}
                    focusToken={focusTarget?.section === 'students' ? focusTarget.at : null}
                  />
                )}
                {section === 'all-records' && <AllRecordsPanel />}
                {section === 'parents' && (
                  <ParentsPanel
                    focusId={focusTarget?.section === 'parents' ? focusTarget.id : null}
                    focusToken={focusTarget?.section === 'parents' ? focusTarget.at : null}
                  />
                )}
                {section === 'coaches' && (
                  <EntryCoachesPanel
                    focusId={focusTarget?.section === 'coaches' ? focusTarget.id : null}
                    focusToken={focusTarget?.section === 'coaches' ? focusTarget.at : null}
                  />
                )}
                {section === 'achievements' && (
                  <PlayerAchievementsPanel
                    focusId={focusTarget?.section === 'achievements' ? focusTarget.id : null}
                    focusToken={focusTarget?.section === 'achievements' ? focusTarget.at : null}
                  />
                )}
                {section === 'tournaments' && (
                  <TournamentRecordsPanel
                    focusId={focusTarget?.section === 'tournaments' ? focusTarget.id : null}
                    focusToken={focusTarget?.section === 'tournaments' ? focusTarget.at : null}
                  />
                )}
                {section === 'equipment' && <EntryEquipmentPanel />}
                {section === 'athletes' && <AthletesPanel />}
                {section === 'legacy-members' && <LegacyMembersPanel />}
                {section === 'gallery' && <GalleryPanel />}
                {section === 'reports' && <ReportsHubPanel />}
                {section === 'sponsorships' && <SponsorshipsPanel />}
                {section === 'coach-attendance' && <CoachAttendancePanel />}
                {section === 'finance-dashboard' && <FinanceDashboardPanel />}
                {section === 'student-fees' && <StudentFeesPanel />}
                {section === 'collect-fees' && <CollectFeesPanel />}
                {section === 'pending-fees' && <PendingFeesPanel />}
                {section === 'coach-payments' && <CoachPaymentsPanel />}
                {section === 'payment-history' && <PaymentHistoryPanel />}
                {section === 'receipts' && <ReceiptsPanel />}
                {section === 'users' && <UsersPanel />}
                {section === 'roles' && <RolesPanel />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
