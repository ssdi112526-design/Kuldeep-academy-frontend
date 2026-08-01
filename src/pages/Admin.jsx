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
import AccessDenied from '../components/admin/AccessDenied';
import { formatBytes } from '../utils/videoUtils';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: FaClipboardList, permission: 'dashboard.view' },
  { id: 'inquiries', label: 'Inquiries', icon: FaInbox, permission: 'inquiries.view' },
  {
    id: 'content',
    label: 'Content Management',
    children: [
      { id: 'programs', label: 'Programs', icon: FaDumbbell, permission: 'programs.view' },
      { id: 'schedule', label: 'Schedule', icon: FaCalendarAlt, permission: 'schedule.view' },
      { id: 'achievements', label: 'Achievements', icon: FaTrophy, permission: 'achievements.view' },
      { id: 'gallery', label: 'Gallery', icon: FaImages, permission: 'gallery.view' },
      { id: 'facilities', label: 'Facilities', icon: FaBuilding, permission: 'facilities.view' },
      { id: 'videos', label: 'Videos', icon: FaVideo, permission: 'videos.view' },
    ],
  },
  {
    id: 'entry',
    label: 'Entry Management',
    children: [
      { id: 'students', label: 'Students', icon: FaUsers, permission: 'students.view' },
      { id: 'coaches', label: 'Coaches', icon: FaUserTie, permission: 'coaches.view' },
      { id: 'equipment', label: 'Equipment & Tools', icon: FaBuilding, permission: 'equipment.view' },
    ],
  },
  {
    id: 'user-mgmt',
    label: 'User Management',
    superAdminOnly: true,
    children: [
      { id: 'users', label: 'Users', icon: FaUserShield, permission: 'users.view' },
      { id: 'roles', label: 'Roles & Permissions', icon: FaUserLock, permission: 'roles.view' },
    ],
  },
];

const SECTION_PERMISSION = {
  dashboard: 'dashboard.view',
  inquiries: 'inquiries.view',
  programs: 'programs.view',
  schedule: 'schedule.view',
  achievements: 'achievements.view',
  gallery: 'gallery.view',
  facilities: 'facilities.view',
  videos: 'videos.view',
  students: 'students.view',
  coaches: 'coaches.view',
  equipment: 'equipment.view',
  users: 'users.view',
  roles: 'roles.view',
};

export default function Admin() {
  const { user, loading, canAccessAdmin, logout } = useAuth();
  const { can, isSuperAdmin } = usePermissions();
  const [section, setSection] = useState('dashboard');
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
    if (canAccessAdmin && can('dashboard.view')) refreshCmsStats();
  }, [canAccessAdmin, can, refreshCmsStats]);

  const filteredNav = useMemo(() => {
    return NAV.map((item) => {
      if (item.children) {
        if (item.superAdminOnly && !isSuperAdmin && !can('users.view') && !can('roles.view')) {
          return null;
        }
        const children = item.children.filter((child) => can(child.permission) || isSuperAdmin);
        if (!children.length) return null;
        return { ...item, children };
      }
      if (!can(item.permission) && !isSuperAdmin) return null;
      return item;
    }).filter(Boolean);
  }, [can, isSuperAdmin]);

  useEffect(() => {
    const allowed = filteredNav.flatMap((item) => (item.children ? item.children.map((c) => c.id) : [item.id]));
    if (allowed.length && !allowed.includes(section)) {
      setSection(allowed[0]);
    }
  }, [filteredNav, section]);

  if (loading) {
    return <PageLoader message="Loading admin panel..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
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
    users: { title: 'Users', subtitle: 'Create accounts and manage staff access.' },
    roles: { title: 'Roles & Permissions', subtitle: 'Configure role-based access across the admin panel.' },
  };

  const meta = titles[section] || titles.dashboard;
  const sectionPerm = SECTION_PERMISSION[section];
  const allowedSection = isSuperAdmin || !sectionPerm || can(sectionPerm);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <header className="z-40 shrink-0 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="text-xs text-muted">
                {user.roleName || user.roleSlug || user.role} · {user.email}
              </p>
            </div>
            <Link to="/" className="text-sm font-medium text-brand hover:underline">
              Website
            </Link>
            <Button variant="secondary" onClick={logout} className="rounded-lg px-4 py-2 text-sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-0 px-4 sm:px-6 lg:flex-row lg:gap-6">
        <aside className="z-30 w-full shrink-0 border-b border-slate-100 bg-surface py-4 lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:py-8">
          <nav className="rounded-xl border border-slate-100 bg-white p-3 lg:sticky lg:top-8">
            {filteredNav.map((item) =>
              item.children ? (
                <div key={item.id} className="mt-2">
                  <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    {item.label}
                  </p>
                  {item.children.map((child) => {
                    const Icon = child.icon;
                    const active = section === child.id;
                    return (
                      <button
                        key={child.id}
                        type="button"
                        onClick={() => setSection(child.id)}
                        className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                          active ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={14} />
                        {child.label}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    section === item.id ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              )
            )}
          </nav>
        </aside>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto py-6 lg:py-8">
          <h1 className="text-2xl font-bold text-ink">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted">{meta.subtitle}</p>

          <div className="mt-6 pb-10">
            {!allowedSection ? (
              <AccessDenied />
            ) : (
              <>
                {section === 'dashboard' && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
