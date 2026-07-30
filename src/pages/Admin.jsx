import { useCallback, useEffect, useState } from 'react';
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
} from 'react-icons/fa';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
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
import { formatBytes } from '../utils/videoUtils';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: FaClipboardList },
  { id: 'inquiries', label: 'Inquiries', icon: FaInbox },
  {
    id: 'content',
    label: 'Content Management',
    children: [
      { id: 'programs', label: 'Programs', icon: FaDumbbell },
      { id: 'gallery', label: 'Gallery', icon: FaImages },
      { id: 'facilities', label: 'Facilities', icon: FaBuilding },
      { id: 'videos', label: 'Videos', icon: FaVideo },
    ],
  },
  {
    id: 'entry',
    label: 'Entry Management',
    children: [
      { id: 'students', label: 'Students', icon: FaUsers },
      { id: 'coaches', label: 'Coaches', icon: FaUserTie },
      { id: 'equipment', label: 'Equipment & Tools', icon: FaBuilding },
    ],
  },
];

export default function Admin() {
  const { user, loading, isAdmin, logout } = useAuth();
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
    if (isAdmin) refreshCmsStats();
  }, [isAdmin, refreshCmsStats]);

  if (loading) {
    return <PageLoader message="Loading admin panel..." />;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const titles = {
    dashboard: { title: 'Dashboard', subtitle: 'Content overview for Raghunandan Akhada.' },
    inquiries: { title: 'Inquiries', subtitle: 'Manage contact form submissions.' },
    programs: { title: 'Programs', subtitle: 'Create and manage training programs.' },
    gallery: { title: 'Gallery', subtitle: 'Upload and organize gallery images.' },
    facilities: { title: 'Facilities', subtitle: 'Manage akhada facilities.' },
    videos: { title: 'Videos', subtitle: 'Upload and manage Akhada training & championship videos.' },
    students: { title: 'Students', subtitle: 'Manage student entries, documents and profiles.' },
    coaches: { title: 'Coaches', subtitle: 'Manage coach entries, documents and profiles.' },
    equipment: { title: 'Equipment & Tools', subtitle: 'Manage akhada equipment, QR codes and history.' },
  };

  const meta = titles[section] || titles.dashboard;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      {/* Fixed top bar — does not scroll */}
      <header className="z-40 shrink-0 border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
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
        {/* Sticky side menu — stays while content scrolls */}
        <aside className="z-30 w-full shrink-0 border-b border-slate-100 bg-surface py-4 lg:w-56 lg:overflow-y-auto lg:border-b-0 lg:py-8">
          <nav className="rounded-xl border border-slate-100 bg-white p-3 lg:sticky lg:top-8">
            {NAV.map((item) =>
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

        {/* Only this area scrolls */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto py-6 lg:py-8">
          <h1 className="text-2xl font-bold text-ink">{meta.title}</h1>
          <p className="mt-1 text-sm text-muted">{meta.subtitle}</p>

          <div className="mt-6 pb-10">
            {section === 'dashboard' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  label="Total Programs"
                  value={cmsStats.totalPrograms}
                  icon={FaDumbbell}
                  loading={statsLoading}
                />
                <StatCard
                  label="Total Gallery Images"
                  value={cmsStats.totalGallery}
                  icon={FaImages}
                  loading={statsLoading}
                />
                <StatCard
                  label="Total Facilities"
                  value={cmsStats.totalFacilities}
                  icon={FaBuilding}
                  loading={statsLoading}
                />
                <StatCard
                  label="Total Videos"
                  value={cmsStats.totalVideos}
                  icon={FaVideo}
                  loading={statsLoading}
                />
                <StatCard
                  label="Published Videos"
                  value={cmsStats.publishedVideos}
                  icon={FaVideo}
                  loading={statsLoading}
                />
                <StatCard
                  label="Video Storage"
                  value={formatBytes(cmsStats.totalStorageBytes || 0)}
                  icon={FaVideo}
                  loading={statsLoading}
                />
              </div>
            )}

            {section === 'inquiries' && <ContactsPanel />}
            {section === 'programs' && <ProgramsPanel onChanged={refreshCmsStats} />}
            {section === 'gallery' && <GalleryPanel onChanged={refreshCmsStats} />}
            {section === 'facilities' && <FacilitiesPanel onChanged={refreshCmsStats} />}
            {section === 'videos' && <VideosPanel onChanged={refreshCmsStats} />}
            {section === 'students' && <EntryStudentsPanel />}
            {section === 'coaches' && <EntryCoachesPanel />}
            {section === 'equipment' && <EntryEquipmentPanel />}
          </div>
        </main>
      </div>
    </div>
  );
}
