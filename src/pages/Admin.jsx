import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  FaClipboardList,
  FaDumbbell,
  FaImages,
  FaBuilding,
  FaInbox,
  FaVideo,
  FaUsers,
  FaUserTie,
  FaUserShield,
  FaUserLock,
  FaCalendarAlt,
  FaTrophy,
  FaBars,
  FaTimes,
  FaCalendarCheck,
  FaFingerprint,
  FaCog,
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { cmsStatsService } from '../services';
import StatCard from '../components/admin/StatCard';
import ContactsPanel from '../components/admin/ContactsPanel';
import ProgramsPanel from '../components/admin/ProgramsPanel';
import GalleryPanel from '../components/admin/GalleryPanel';
import FacilitiesPanel from '../components/admin/FacilitiesPanel';
import VideosPanel from '../components/admin/VideosPanel';
import EntryStudentsPanel from '../components/admin/EntryStudentsPanel';
import EntryCoachesPanel from '../components/admin/EntryCoachesPanel';
import EntryEquipmentPanel from '../components/admin/EntryEquipmentPanel';
import UsersPanel from '../components/admin/UsersPanel';
import RolesPanel from '../components/admin/RolesPanel';
import AchievementsPanel from '../components/admin/AchievementsPanel';
import SchedulePanel from '../components/admin/SchedulePanel';
import AttendancePanel from '../components/admin/AttendancePanel';
import CoachAttendancePanel from '../components/admin/CoachAttendancePanel';
import BiometricDevicesPanel from '../components/admin/BiometricDevicesPanel';
import AttendanceSettingsPanel from '../components/admin/AttendanceSettingsPanel';
import AccessDenied from '../components/admin/AccessDenied';
import { formatBytes } from '../utils/videoUtils';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: FaClipboardList, module: 'dashboard', permission: 'dashboard.view' },
  { id: 'inquiries', label: 'Inquiries', icon: FaInbox, module: 'inquiries', permission: 'inquiries.view' },
  {
    id: 'content',
    label: 'Content Management',
    children: [
      { id: 'programs', label: 'Programs', icon: FaDumbbell, module: 'programs', permission: 'programs.view' },
      { id: 'schedule', label: 'Schedule', icon: FaCalendarAlt, module: 'schedule', permission: 'schedule.view' },
      { id: 'achievements', label: 'Achievements', icon: FaTrophy, module: 'achievements', permission: 'achievements.view' },
      { id: 'gallery', label: 'Gallery', icon: FaImages, module: 'gallery', permission: 'gallery.view' },
      { id: 'facilities', label: 'Facilities', icon: FaBuilding, module: 'facilities', permission: 'facilities.view' },
      { id: 'videos', label: 'Videos', icon: FaVideo, module: 'videos', permission: 'videos.view' },
    ],
  },
  {
    id: 'entry',
    label: 'Entry Management',
    children: [
      { id: 'students', label: 'Students', icon: FaUsers, module: 'students', permission: 'students.view' },
      { id: 'coaches', label: 'Coaches', icon: FaUserTie, module: 'coaches', permission: 'coaches.view' },
      { id: 'equipment', label: 'Equipment & Tools', icon: FaBuilding, module: 'equipment', permission: 'equipment.view' },
    ],
  },
  {
    id: 'attendance-menu',
    label: 'Attendance',
    children: [
      { id: 'attendance', label: 'Students', icon: FaUsers, module: 'attendance', permission: 'attendance.view' },
      { id: 'coach-attendance', label: 'Coaches', icon: FaUserTie, module: 'attendance', permission: 'attendance.view' },
      { id: 'biometric-devices', label: 'Biometric Devices', icon: FaFingerprint, module: 'attendance', permission: 'attendance.view' },
      { id: 'attendance-settings', label: 'Attendance Settings', icon: FaCog, module: 'attendance', permission: 'attendance.view' },
    ],
  },
  {
    id: 'user-mgmt',
    label: 'User Management',
    superAdminOnly: true,
    children: [
      { id: 'users', label: 'Users', icon: FaUserShield, module: 'users', permission: 'users.view' },
      { id: 'roles', label: 'Roles & Permissions', icon: FaUserLock, module: 'roles', permission: 'roles.view' },
    ],
  },
];

const SECTION_MODULE = {
  dashboard: 'dashboard',
  inquiries: 'inquiries',
  programs: 'programs',
  schedule: 'schedule',
  achievements: 'achievements',
  gallery: 'gallery',
  facilities: 'facilities',
  videos: 'videos',
  students: 'students',
  coaches: 'coaches',
  equipment: 'equipment',
  attendance: 'attendance',
  'coach-attendance': 'attendance',
  'biometric-devices': 'attendance',
  'attendance-settings': 'attendance',
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
  const { user, loading, canAccessAdmin, logout, isStudent, isCoach } = useAuth();
  const { can, canModule, isSuperAdmin } = usePermissions();
  const [section, setSection] = useState('dashboard');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [cmsStats, setCmsStats] = useState({
    totalPrograms: 0,
    totalGallery: 0,
    totalFacilities: 0,
    totalVideos: 0,
    publishedVideos: 0,
    draftVideos: 0,
    featuredVideos: 0,
    totalStorageBytes: 0,
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
      if (isSuperAdmin) return true;
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
    const allowed = filteredNav.flatMap((item) => (item.children ? item.children.map((c) => c.id) : [item.id]));
    if (allowed.length && !allowed.includes(section)) {
      setSection(allowed[0]);
    }
  }, [filteredNav, section]);

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
  if (!canAccessAdmin && !isSuperAdmin) return <Navigate to="/" replace />;

  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Content overview for Raghunandan Akhada.' },
    inquiries: { title: 'Inquiries', subtitle: 'Manage contact form submissions.' },
    programs: { title: 'Programs', subtitle: 'Create and manage training programs.' },
    schedule: { title: 'Schedule', subtitle: 'Update training sessions and weekly timetable.' },
    achievements: { title: 'Achievements', subtitle: 'Update homepage achievement counters.' },
    gallery: { title: 'Gallery', subtitle: 'Upload and organize gallery images.' },
    facilities: { title: 'Facilities', subtitle: 'Manage akhada facilities.' },
    videos: { title: 'Videos', subtitle: 'Upload and manage Akhada training & championship videos.' },
    students: { title: 'Students', subtitle: 'Manage student entries, documents and profiles.' },
    coaches: { title: 'Coaches', subtitle: 'Manage coach entries, documents and profiles.' },
    equipment: { title: 'Equipment & Tools', subtitle: 'Manage akhada equipment, QR codes and history.' },
    attendance: { title: 'Student Attendance', subtitle: 'Mark daily student attendance, track history, and export reports.' },
    'coach-attendance': { title: 'Coach Attendance', subtitle: 'Mark daily coach attendance, track history, and export reports.' },
    'biometric-devices': {
      title: 'Biometric Devices',
      subtitle: 'Manage fingerprint devices, sync agents, enrollment mappings, and unknown punch logs.',
    },
    'attendance-settings': {
      title: 'Attendance Settings',
      subtitle: 'Configure Akhada GPS location and 500m QR geofence radius.',
    },
    users: { title: 'Users', subtitle: 'Create accounts and manage staff access.' },
    roles: { title: 'Roles & Permissions', subtitle: 'Configure role-based access across the admin panel.' },
  };

  const meta = titles[section] || titles.dashboard;
  const sectionModule = SECTION_MODULE[section];
  const allowedSection = isSuperAdmin || !sectionModule || canModule(sectionModule);

  const selectSection = (id) => {
    setSection(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-surface">
      <header className="relative z-[60] shrink-0 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:px-6 sm:py-4">
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
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="max-w-[180px] truncate text-xs text-muted">
                {user.roleName || user.roleSlug || user.role} · {user.email}
              </p>
            </div>
            <Link to="/" className="hidden text-sm font-medium text-brand hover:underline sm:inline">
              Website
            </Link>
            <Button variant="secondary" onClick={logout} className="rounded-lg px-3 py-2 text-sm sm:px-4">
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard label="Total Programs" value={cmsStats.totalPrograms} icon={FaDumbbell} loading={statsLoading} />
                    <StatCard label="Total Gallery Images" value={cmsStats.totalGallery} icon={FaImages} loading={statsLoading} />
                    <StatCard label="Total Facilities" value={cmsStats.totalFacilities} icon={FaBuilding} loading={statsLoading} />
                    <StatCard label="Total Videos" value={cmsStats.totalVideos} icon={FaVideo} loading={statsLoading} />
                    <StatCard label="Published Videos" value={cmsStats.publishedVideos} icon={FaVideo} loading={statsLoading} />
                    <StatCard label="Video Storage" value={formatBytes(cmsStats.totalStorageBytes || 0)} icon={FaVideo} loading={statsLoading} />
                  </div>
                )}

                {section === 'inquiries' && <ContactsPanel />}
                {section === 'programs' && <ProgramsPanel onChanged={refreshCmsStats} />}
                {section === 'schedule' && <SchedulePanel />}
                {section === 'achievements' && <AchievementsPanel />}
                {section === 'gallery' && <GalleryPanel onChanged={refreshCmsStats} />}
                {section === 'facilities' && <FacilitiesPanel onChanged={refreshCmsStats} />}
                {section === 'videos' && <VideosPanel onChanged={refreshCmsStats} />}
                {section === 'students' && <EntryStudentsPanel />}
                {section === 'coaches' && <EntryCoachesPanel />}
                {section === 'equipment' && <EntryEquipmentPanel />}
                {section === 'attendance' && <AttendancePanel />}
                {section === 'coach-attendance' && <CoachAttendancePanel />}
                {section === 'biometric-devices' && <BiometricDevicesPanel />}
                {section === 'attendance-settings' && <AttendanceSettingsPanel />}
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
