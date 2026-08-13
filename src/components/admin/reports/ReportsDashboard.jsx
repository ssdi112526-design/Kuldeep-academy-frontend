import { useEffect, useState } from 'react';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import { inr } from '../../../utils/financeUi';
import { ReportStatCard, SimpleBars } from './reportUi';

export default function ReportsDashboard({ onOpen }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await reportsService.dashboard();
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) {
          const msg = getApiErrorMessage(err, 'Failed to load dashboard');
          setError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  if (loading) {
    return <p className="py-12 text-center text-muted">Loading dashboard…</p>;
  }
  if (error && !data) {
    return <p className="py-12 text-center text-red-600">{error}</p>;
  }

  const cards = data?.cards || {};
  const charts = data?.charts || {};
  const open = (id) => onOpen?.(id);

  const cardItems = [
    { label: 'Total Players', value: cards.totalPlayers ?? 0, id: 'players' },
    { label: 'Khelo India', value: cards.kheloIndiaPlayers ?? 0, id: 'khelo' },
    {
      label: 'Other Categories',
      value: cards.otherPlayerCategories ?? 0,
      id: 'player-category',
    },
    {
      label: 'Employees',
      value: cards.totalEmployees ?? 0,
      id: 'employee-attendance',
    },
    { label: 'Tournaments', value: cards.totalTournaments ?? 0, id: 'tournaments' },
    { label: 'Medals', value: cards.totalMedals ?? 0, id: 'medals' },
    {
      label: 'Pending Fees',
      value: inr(cards.pendingFees ?? 0),
      id: 'pending-fees',
      accent: 'text-red-600',
    },
    {
      label: 'Active Sponsorships',
      value: cards.activeSponsorships ?? 0,
      id: 'sponsorships',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-ink">Reports overview</h2>
        <p className="mt-1 text-sm text-muted">Click a card to open that report.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((c) => (
          <ReportStatCard
            key={c.id}
            label={c.label}
            value={c.value}
            accent={c.accent}
            onClick={() => open(c.id)}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-ink">Attendance (this month)</h3>
          <div className="mt-3">
            <SimpleBars items={charts.attendanceBreakdown || []} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-ink">Medals</h3>
          <div className="mt-3">
            <SimpleBars items={charts.medalDistribution || []} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-ink">Players by category</h3>
          <div className="mt-3">
            <SimpleBars items={charts.playersByCategory || []} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-bold text-ink">Fees paid vs pending</h3>
          <div className="mt-3">
            <SimpleBars items={charts.feesPaidVsPending || []} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-ink">Salary paid vs pending</h3>
          <div className="mt-3 max-w-md">
            <SimpleBars items={charts.salaryPaidVsPending || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
