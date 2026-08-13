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

export default function KheloIndiaReportPanel() {
  const toast = useToast();
  const { can } = usePermissions();
  const canExport = can('reports.export');
  const canPrint = can('reports.print');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
  };

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await reportsService.kheloIndia({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      setTotal(data.total ?? data.summary?.total ?? 0);
      const tot = data.total || 0;
      const limit = data.limit || pagination.limit;
      setPagination((p) => ({
        ...p,
        page: data.page || page,
        limit,
        total: tot,
        pages: Math.max(1, Math.ceil(tot / limit)),
      }));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load Khelo India report'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status, pagination.limit]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Khelo India players</h2>
          <p className="mt-1 text-sm text-muted">Players matched under Khelo India category.</p>
        </div>
        <ReportExportBar
          reportKey="khelo-india"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      <div className="mt-4 max-w-xs">
        <ReportStatCard label="Total Khelo India" value={total} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search…" />
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
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'fullName', label: 'Name' },
          { key: 'registrationNumber', label: 'Reg No' },
          {
            key: 'category',
            label: 'Category',
            render: (r) => r.resolvedPlayerCategory || r.category || '—',
          },
          {
            key: 'age',
            label: 'Age',
            render: (r) => r.ageComputed ?? r.age ?? '—',
          },
          { key: 'gender', label: 'Gender' },
          {
            key: 'weight',
            label: 'Weight category',
            render: (r) => r.resolvedWeightCategory || '—',
          },
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
