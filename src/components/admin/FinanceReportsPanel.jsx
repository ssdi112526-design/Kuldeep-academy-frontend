import { useState } from 'react';
import {
  FaDownload,
  FaHandHoldingUsd,
  FaBalanceScale,
  FaCoins,
  FaPercent,
  FaWallet,
} from 'react-icons/fa';
import Button from '../ui/Button';
import StatCard from './StatCard';
import AccessDenied from './AccessDenied';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { inr, PAYMENT_MODES, MONTHS, currentMonthYear } from '../../utils/financeUi';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export default function FinanceReportsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canExport = can('finance.export');

  const cy = currentMonthYear();
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    month: '',
    year: '',
    paymentMode: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const buildFilterPayload = () => ({
    from: filters.from || undefined,
    to: filters.to || undefined,
    month: filters.month || undefined,
    year: filters.year || undefined,
    paymentMode: filters.paymentMode || undefined,
  });

  const loadReport = async (e) => {
    e?.preventDefault?.();
    if (!canView) return;
    setLoading(true);
    try {
      const res = await financeService.report(buildFilterPayload());
      setReport(res.data.data);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load report'));
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    if (!canExport) {
      toast.error('You do not have permission to export');
      return;
    }
    const key = `${type}-${format}`;
    setExporting(key);
    try {
      const payload = { ...buildFilterPayload(), format };
      let res;
      let filename;
      if (type === 'payments') {
        res = await financeService.exportPayments(payload);
        filename = `fee-payments`;
      } else if (type === 'coach') {
        res = await financeService.exportCoachPayments(payload);
        filename = `coach-payments`;
      } else {
        res = await financeService.exportPending(payload);
        filename = `pending-fees`;
      }
      const mime =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      triggerBlobDownload(
        new Blob([res.data], { type: mime }),
        `${filename}-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting('');
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <form
        onSubmit={loadReport}
        className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        <h2 className="text-lg font-bold text-ink">Finance report</h2>
        <p className="mt-1 text-sm text-muted">Filter by date range, month/year, or payment mode.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs font-medium text-muted">
            From
            <input
              type="date"
              className={`mt-1 ${inputClass}`}
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            To
            <input
              type="date"
              className={`mt-1 ${inputClass}`}
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Month
            <select
              className={`mt-1 ${inputClass}`}
              value={filters.month}
              onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}
            >
              <option value="">Any</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-muted">
            Year
            <input
              type="number"
              className={`mt-1 ${inputClass}`}
              placeholder={String(cy.year)}
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
            />
          </label>
          <label className="block text-xs font-medium text-muted">
            Mode
            <select
              className={`mt-1 ${inputClass}`}
              value={filters.paymentMode}
              onChange={(e) => setFilters((f) => ({ ...f, paymentMode: e.target.value }))}
            >
              <option value="">All</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="submit" className="rounded-lg text-sm" disabled={loading}>
            {loading ? 'Loading…' : 'Run report'}
          </Button>
        </div>
      </form>

      {report && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Student fees collected"
            value={inr(report.totalStudentFeesCollected)}
            icon={FaWallet}
          />
          <StatCard
            label="Coach payments"
            value={inr(report.totalCoachPayments)}
            icon={FaCoins}
          />
          <StatCard label="Discounts" value={inr(report.totalDiscounts)} icon={FaPercent} />
          <StatCard
            label="Pending fees"
            value={inr(report.totalPendingFees)}
            icon={FaHandHoldingUsd}
          />
          <StatCard label="Net balance" value={inr(report.netBalance)} icon={FaBalanceScale} />
        </div>
      )}

      {canExport && (
        <div className="mt-6 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-ink">Exports</h3>
          <p className="mt-1 text-xs text-muted">Uses the same filters as above.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('payments', 'xlsx')}
            >
              <FaDownload size={12} /> Student payments (Excel)
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('payments', 'csv')}
            >
              <FaDownload size={12} /> Student payments (CSV)
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('coach', 'xlsx')}
            >
              <FaDownload size={12} /> Coach payments (Excel)
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('coach', 'csv')}
            >
              <FaDownload size={12} /> Coach payments (CSV)
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('pending', 'xlsx')}
            >
              <FaDownload size={12} /> Pending fees (Excel)
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={Boolean(exporting)}
              onClick={() => handleExport('pending', 'csv')}
            >
              <FaDownload size={12} /> Pending fees (CSV)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
