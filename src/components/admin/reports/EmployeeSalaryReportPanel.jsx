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
  ReportStatCard,
  ReportTable,
  MONTHS,
  currentMonthYear,
  reportInputClass,
  feeStatusBadge,
} from './reportUi';

export default function EmployeeSalaryReportPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canExport = can('reports.export') || can('finance.export');
  const canPrint = can('reports.print');
  const cy = currentMonthYear();

  const [month, setMonth] = useState(cy.month);
  const [year, setYear] = useState(cy.year);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    month,
    year,
    search: debouncedSearch.trim() || undefined,
  };

  const load = async (page = pagination.page) => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await reportsService.salary({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      setSummary(data.summary || null);
      const total = data.total || data.rows?.length || 0;
      const limit = data.limit || pagination.limit;
      setPagination((p) => ({
        ...p,
        page: data.page || page,
        limit,
        total,
        pages: Math.max(1, Math.ceil(total / limit)),
      }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load salary report'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, month, year, debouncedSearch, pagination.limit]);

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Employee salary</h2>
          <p className="mt-1 text-sm text-muted">Coach / staff salary payments.</p>
        </div>
        <ReportExportBar
          reportKey="salary"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      {summary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <ReportStatCard label="Total salary" value={inr(summary.totalSalary)} />
          <ReportStatCard
            label="Paid"
            value={inr(summary.paidSalary)}
            accent="text-emerald-600"
          />
          <ReportStatCard
            label="Pending"
            value={inr(summary.pendingSalary)}
            accent="text-red-600"
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          className={`${reportInputClass} w-40`}
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
        >
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${reportInputClass} w-28`}
          value={year}
          onChange={(e) => setYear(Number(e.target.value) || cy.year)}
        />
        <SearchBar value={search} onChange={setSearch} placeholder="Search employee…" />
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'employeeName', label: 'Employee' },
          { key: 'role', label: 'Role' },
          { key: 'category', label: 'Category' },
          {
            key: 'salary',
            label: 'Salary',
            render: (r) => inr(r.salary ?? r.netPayable),
          },
          {
            key: 'paymentDate',
            label: 'Payment date',
            render: (r) => r.paymentDateLabel || '—',
          },
          {
            key: 'paid',
            label: 'Paid',
            render: (r) => inr(r.paidAmount),
          },
          {
            key: 'pending',
            label: 'Pending',
            render: (r) => inr(r.pendingAmount ?? r.remainingAmount),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => feeStatusBadge(r.paymentStatus || r.status),
          },
          { key: 'monthLabel', label: 'Month' },
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
