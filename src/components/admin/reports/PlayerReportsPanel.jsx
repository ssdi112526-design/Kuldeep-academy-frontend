import { useEffect, useState } from 'react';
import SearchBar from '../SearchBar';
import Pagination from '../Pagination';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import {
  ReportExportBar,
  ReportStatCard,
  ReportTable,
  reportInputClass,
} from './reportUi';

export default function PlayerReportsPanel() {
  const toast = useToast();
  const { can } = usePermissions();
  const canExport = can('reports.export');
  const canPrint = can('reports.print');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    category: category || undefined,
    from: from || undefined,
    to: to || undefined,
  };

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await reportsService.players({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      setSummary(data.summary || null);
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
      toast.error(getApiErrorMessage(err, 'Failed to load players'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, category, from, to, pagination.limit]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Player report</h2>
          <p className="mt-1 text-sm text-muted">Search and filter academy players.</p>
        </div>
        <ReportExportBar
          reportKey="players"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      {summary && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ReportStatCard label="Total" value={summary.total ?? 0} />
          <ReportStatCard label="Active" value={summary.active ?? 0} accent="text-emerald-600" />
          <ReportStatCard label="Inactive" value={summary.inactive ?? 0} />
          <ReportStatCard label="Khelo India" value={summary.kheloIndia ?? 0} />
          <ReportStatCard label="New (30d)" value={summary.newPlayers ?? 0} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <SearchBar value={search} onChange={setSearch} placeholder="Search players…" />
        <select
          className={`${reportInputClass} max-w-[10rem]`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Suspended">Suspended</option>
        </select>
        <input
          className={`${reportInputClass} max-w-[12rem]`}
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <label className="text-xs text-muted">
          From
          <input
            type="date"
            className={`mt-1 ${reportInputClass}`}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-xs text-muted">
          To
          <input
            type="date"
            className={`mt-1 ${reportInputClass}`}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'registrationNumber', label: 'Reg No' },
          { key: 'fullName', label: 'Name' },
          {
            key: 'category',
            label: 'Category',
            render: (r) => r.resolvedPlayerCategory || r.category || '—',
          },
          {
            key: 'age',
            label: 'Age Cat.',
            render: (r) => r.resolvedAgeCategory || '—',
          },
          {
            key: 'weight',
            label: 'Weight',
            render: (r) => r.resolvedWeightCategory || '—',
          },
          { key: 'gender', label: 'Gender' },
          { key: 'mobileNumber', label: 'Contact' },
          {
            key: 'joining',
            label: 'Joining',
            render: (r) => r.joiningDateLabel || '—',
          },
          { key: 'status', label: 'Status' },
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
