import { useEffect, useState } from 'react';
import SearchBar from '../SearchBar';
import Pagination from '../Pagination';
import AccessDenied from '../AccessDenied';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import { inr } from '../../../utils/financeUi';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import {
  ReportExportBar,
  ReportTable,
  feeStatusBadge,
  MONTHS,
  currentMonthYear,
  reportInputClass,
} from './reportUi';

export default function PendingFeesReportPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canExport = can('reports.export') || can('finance.export');
  const canPrint = can('reports.print');
  const cy = currentMonthYear();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    search: debouncedSearch.trim() || undefined,
    month: month || undefined,
    year: year || undefined,
    status: status || undefined,
  };

  const load = async (page = pagination.page) => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await reportsService.pendingFees({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      const total = data.total || 0;
      const limit = data.limit || pagination.limit;
      setPagination((p) => ({
        ...p,
        page: data.page || page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load pending fees'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, debouncedSearch, month, year, status, pagination.limit]);

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Pending fees</h2>
          <p className="mt-1 text-sm text-muted">Outstanding student fee months.</p>
        </div>
        <ReportExportBar
          reportKey="pending-fees"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search player…" />
        <select
          className={`${reportInputClass} w-40`}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">Any month</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${reportInputClass} w-28`}
          placeholder={String(cy.year)}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <select
          className={`${reportInputClass} max-w-[10rem]`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="Due">Due</option>
          <option value="Partial">Partial</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          {
            key: 'player',
            label: 'Player',
            render: (r) => r.student?.fullName || r.player || '—',
          },
          {
            key: 'reg',
            label: 'Reg No',
            render: (r) => r.student?.registrationNumber || r.registrationNumber || '—',
          },
          {
            key: 'feeType',
            label: 'Fee type',
            render: (r) => r.feeType || r.categoryLabel || r.category || '—',
          },
          {
            key: 'totalFee',
            label: 'Total',
            render: (r) => inr(r.totalFee ?? r.feeAmount),
          },
          {
            key: 'paid',
            label: 'Paid',
            render: (r) => inr(r.paidAmount),
          },
          {
            key: 'pending',
            label: 'Pending',
            render: (r) => inr(r.pendingAmount ?? r.remainingDue),
          },
          {
            key: 'due',
            label: 'Due date',
            render: (r) => r.dueDateLabel || '—',
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => feeStatusBadge(r.status),
          },
        ]}
      />
      <Pagination
        pagination={pagination}
        onPageChange={(page) => load(page)}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit }))}
      />
    </div>
  );
}
