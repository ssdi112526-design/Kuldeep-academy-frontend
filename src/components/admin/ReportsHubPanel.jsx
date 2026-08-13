import { useMemo, useState } from 'react';
import {
  FaChartBar,
  FaUsers,
  FaMedal,
  FaCalendarCheck,
  FaMoneyBillWave,
  FaHandshake,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import AccessDenied from './AccessDenied';
import { usePermissions } from '../../context/PermissionContext';
import {
  ReportsDashboard,
  PlayerReportsPanel,
  KheloIndiaReportPanel,
  AttendanceDashboardPanel,
  MonthlyAttendanceReportPanel,
  EmployeeAttendanceReportPanel,
  AgeCategoryReportPanel,
  PlayerCategoryReportPanel,
  WeightCategoryReportPanel,
  TournamentRecordsReportPanel,
  MedalRecordsReportPanel,
  PendingFeesReportPanel,
  EmployeeSalaryReportPanel,
  SponsorshipDocumentsReportPanel,
} from './reports';

const GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Reports Dashboard', icon: FaChartBar }],
  },
  {
    id: 'players',
    label: 'Players',
    module: 'students',
    items: [
      { id: 'players', label: 'Player Reports', icon: FaUsers },
      { id: 'khelo', label: 'Khelo India Players', icon: FaUsers },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance',
    module: 'attendance',
    items: [
      { id: 'attendance-dashboard', label: 'Attendance Dashboard', icon: FaCalendarCheck },
      { id: 'monthly-attendance', label: 'Monthly Attendance', icon: FaCalendarCheck },
      { id: 'employee-attendance', label: 'Employee Attendance', icon: FaCalendarCheck },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    module: 'students',
    items: [
      { id: 'age-category', label: 'Age Category' },
      { id: 'player-category', label: 'Player Category' },
      { id: 'weight-category', label: 'Weight Category' },
    ],
  },
  {
    id: 'competition',
    label: 'Competition',
    moduleAny: ['tournaments', 'player_achievements'],
    items: [
      { id: 'tournaments', label: 'Tournament Records', icon: FaMedal },
      { id: 'medals', label: 'Medal Records', icon: FaMedal },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    module: 'finance',
    sensitive: true,
    items: [
      { id: 'pending-fees', label: 'Pending Fees', icon: FaMoneyBillWave },
      { id: 'salary', label: 'Employee Salary', icon: FaMoneyBillWave },
    ],
  },
  {
    id: 'sponsorships',
    label: 'Sponsorships',
    module: 'sponsorships',
    sensitive: true,
    items: [
      { id: 'sponsorships', label: 'Sponsorship Documents', icon: FaHandshake },
    ],
  },
];

const PANEL_MAP = {
  dashboard: ReportsDashboard,
  players: PlayerReportsPanel,
  khelo: KheloIndiaReportPanel,
  'attendance-dashboard': AttendanceDashboardPanel,
  'monthly-attendance': MonthlyAttendanceReportPanel,
  'employee-attendance': EmployeeAttendanceReportPanel,
  'age-category': AgeCategoryReportPanel,
  'player-category': PlayerCategoryReportPanel,
  'weight-category': WeightCategoryReportPanel,
  tournaments: TournamentRecordsReportPanel,
  medals: MedalRecordsReportPanel,
  'pending-fees': PendingFeesReportPanel,
  salary: EmployeeSalaryReportPanel,
  sponsorships: SponsorshipDocumentsReportPanel,
};

export default function ReportsHubPanel() {
  const { canModule, isSuperAdmin } = usePermissions();
  const canView =
    isSuperAdmin ||
    canModule('reports') ||
    canModule('students') ||
    canModule('attendance') ||
    canModule('finance') ||
    canModule('tournaments');

  const [active, setActive] = useState('dashboard');
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(GROUPS.map((g) => [g.id, true]))
  );

  const visibleGroups = useMemo(() => {
    return GROUPS.filter((g) => {
      if (isSuperAdmin || canModule('reports')) {
        if (g.sensitive && g.module === 'finance') return canModule('finance') || isSuperAdmin;
        if (g.sensitive && g.module === 'sponsorships') {
          return canModule('sponsorships') || isSuperAdmin;
        }
        return true;
      }
      if (g.module) return canModule(g.module);
      if (g.moduleAny) return g.moduleAny.some((m) => canModule(m));
      return true;
    }).map((g) => ({
      ...g,
      items: g.items.filter(() => true),
    }));
  }, [canModule, isSuperAdmin]);

  if (!canView) return <AccessDenied />;

  const ActivePanel = PANEL_MAP[active] || ReportsDashboard;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 rounded-xl border border-slate-100 bg-white p-3 print:hidden lg:w-64">
        <p className="px-2 text-xs font-bold uppercase tracking-wide text-muted">Reports</p>
        <nav className="mt-2 space-y-1">
          {visibleGroups.map((group) => {
            const open = openGroups[group.id];
            return (
              <div key={group.id}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenGroups((s) => ({ ...s, [group.id]: !s[group.id] }))
                  }
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:bg-slate-50"
                >
                  {group.label}
                  {open ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />}
                </button>
                {open && (
                  <ul className="mt-0.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon || FaChartBar;
                      const selected = active === item.id;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => setActive(item.id)}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                              selected
                                ? 'bg-brand/10 font-semibold text-brand'
                                : 'text-ink hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="shrink-0 opacity-70" size={13} />
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {active === 'dashboard' ? (
          <ReportsDashboard onOpen={setActive} />
        ) : (
          <ActivePanel />
        )}
      </div>
    </div>
  );
}
