import { useEffect, useMemo, useState } from 'react';
import {
  FaCoins,
  FaHandHoldingUsd,
  FaUserCheck,
  FaUserClock,
  FaUsers,
  FaWallet,
  FaBalanceScale,
  FaChartBar,
} from 'react-icons/fa';
import AccessDenied from './AccessDenied';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { formatCurrencyINR, paymentModeLabel } from '../../utils/financeUi';

function FinanceMiniCard({ label, value, icon: Icon, hint, accent = 'brand', loading }) {
  const accents = {
    brand: 'bg-[#EFF6FF] text-[#2563EB]',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex min-h-[88px] items-start gap-3 rounded-xl border border-slate-100 bg-white px-3.5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      {Icon ? (
        <div
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accents[accent] || accents.brand}`}
          aria-hidden
        >
          <Icon size={15} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
        <p className="mt-1 truncate text-lg font-bold leading-tight tabular-nums text-ink sm:text-xl">
          {loading ? '…' : value}
        </p>
        {hint ? <p className="mt-0.5 truncate text-[11px] text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

function CssBarList({ items, emptyLabel = 'No data', colorClass = 'bg-brand' }) {
  const max = Math.max(1, ...items.map((i) => Number(i.total) || 0));
  if (!items.length) {
    return <p className="py-5 text-center text-sm text-muted">{emptyLabel}</p>;
  }
  return (
    <ul className="space-y-2.5">
      {items.map((item) => {
        const total = Number(item.total) || 0;
        const pct = Math.round((total / max) * 100);
        const key = item.label || item.mode;
        return (
          <li key={key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-xs">
              <span className="min-w-0 truncate font-medium text-ink">{key}</span>
              <span className="shrink-0 tabular-nums text-muted">{formatCurrencyINR(total)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export default function FinanceDashboardPanel() {
  const { canModule } = usePermissions();
  const canView = canModule('finance');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!canView) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await financeService.dashboard();
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Failed to load finance dashboard'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView]);

  const paidVsPending = useMemo(() => {
    const collected = Number(data?.summary?.studentCollection) || 0;
    const pending = Number(data?.studentFees?.totalPending) || 0;
    return [
      { label: 'Collected (month)', total: collected },
      { label: 'Pending dues', total: pending },
    ];
  }, [data]);

  if (!canView) return <AccessDenied />;

  const sf = data?.studentFees || {};
  const cp = data?.coachPayments || {};
  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const net = Number(summary.netBalance) || 0;

  return (
    <div className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <section>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Student Fees</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <FinanceMiniCard
            label="Today's Collection"
            value={formatCurrencyINR(sf.todayCollection)}
            icon={FaCoins}
            loading={loading}
            accent="brand"
          />
          <FinanceMiniCard
            label="This Month"
            value={formatCurrencyINR(sf.monthCollection)}
            icon={FaWallet}
            loading={loading}
            accent="brand"
          />
          <FinanceMiniCard
            label="Total Pending"
            value={formatCurrencyINR(sf.totalPending)}
            icon={FaHandHoldingUsd}
            loading={loading}
            accent="rose"
          />
          <FinanceMiniCard
            label="Students With Due"
            value={sf.studentsWithDue ?? 0}
            icon={FaUserClock}
            loading={loading}
            accent="amber"
            hint="Open dues"
          />
          <FinanceMiniCard
            label="Paid This Month"
            value={sf.studentsPaid ?? 0}
            icon={FaUserCheck}
            loading={loading}
            accent="emerald"
            hint="Fully paid months"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Coach Payments</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FinanceMiniCard
            label="Paid This Month"
            value={formatCurrencyINR(cp.monthPayments)}
            icon={FaCoins}
            loading={loading}
          />
          <FinanceMiniCard
            label="Coach Pending"
            value={formatCurrencyINR(cp.totalPending)}
            icon={FaHandHoldingUsd}
            loading={loading}
            accent="amber"
          />
          <FinanceMiniCard
            label="Coaches Paid"
            value={cp.coachesPaid ?? 0}
            icon={FaUserCheck}
            loading={loading}
            accent="emerald"
          />
          <FinanceMiniCard
            label="Coaches Pending"
            value={cp.coachesPending ?? 0}
            icon={FaUsers}
            loading={loading}
            accent="slate"
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <FaBalanceScale className="text-brand" size={14} aria-hidden />
          <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Financial Summary</h2>
          <span className="text-[11px] text-muted">(This month)</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-slate-50 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Student Collection</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {loading ? '…' : formatCurrencyINR(summary.studentCollection)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Coach Payouts</p>
            <p className="mt-1 text-xl font-bold tabular-nums text-ink">
              {loading ? '…' : formatCurrencyINR(summary.coachPayments)}
            </p>
          </div>
          <div
            className={`rounded-lg px-3.5 py-3 ${
              net >= 0 ? 'bg-[#EFF6FF] ring-1 ring-[#BFDBFE]' : 'bg-rose-50 ring-1 ring-rose-100'
            }`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Net Balance</p>
            <p className={`mt-1 text-xl font-bold tabular-nums ${net >= 0 ? 'text-[#1D4ED8]' : 'text-rose-700'}`}>
              {loading ? '…' : formatCurrencyINR(summary.netBalance)}
            </p>
            <p className="mt-1 text-[11px] text-muted">Collection − Coach payouts</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {['Cash', 'UPI', 'BankTransfer', 'Other'].map((mode) => (
            <div key={mode} className="rounded-lg border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">{paymentModeLabel(mode)}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                {loading ? '…' : formatCurrencyINR(summary.byMode?.[mode] || 0)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="mb-3 flex items-center gap-2">
            <FaChartBar className="text-brand" size={13} aria-hidden />
            <h3 className="text-sm font-semibold text-ink">Paid vs Pending</h3>
          </div>
          <CssBarList
            items={paidVsPending}
            emptyLabel={loading ? 'Loading…' : 'No data'}
            colorClass="bg-[#2563EB]"
          />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="mb-3 text-sm font-semibold text-ink">Payment Mode</h3>
          <CssBarList
            items={(charts.paymentModeBreakdown || []).map((m) => ({
              mode: paymentModeLabel(m.mode),
              total: m.total,
            }))}
            emptyLabel={loading ? 'Loading…' : 'No collections this month'}
            colorClass="bg-emerald-500"
          />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="mb-3 text-sm font-semibold text-ink">Monthly Student Collection</h3>
          <CssBarList
            items={charts.monthlyStudentCollection || []}
            emptyLabel={loading ? 'Loading…' : 'No student collections'}
          />
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <h3 className="mb-3 text-sm font-semibold text-ink">Monthly Coach Payments</h3>
          <CssBarList
            items={charts.monthlyCoachPayments || []}
            emptyLabel={loading ? 'Loading…' : 'No coach payments'}
            colorClass="bg-amber-500"
          />
        </div>
      </section>
    </div>
  );
}
