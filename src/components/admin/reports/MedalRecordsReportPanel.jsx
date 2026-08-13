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
  medalBadge,
  reportInputClass,
  currentMonthYear,
} from './reportUi';

export default function MedalRecordsReportPanel() {
  const toast = useToast();
  const { can } = usePermissions();
  const canExport = can('reports.export');
  const canPrint = can('reports.print');
  const cy = currentMonthYear();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [medal, setMedal] = useState('');
  const [year, setYear] = useState('');
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    search: debouncedSearch.trim() || undefined,
    medal: medal || undefined,
    year: year || undefined,
  };

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await reportsService.medals({
        ...filters,
        page,
        limit: pagination.limit,
      });
      const data = res.data.data;
      setRows(data.rows || []);
      setCounts(data.counts || null);
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
      toast.error(getApiErrorMessage(err, 'Failed to load medals'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, medal, year, pagination.limit]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Medal records</h2>
          <p className="mt-1 text-sm text-muted">Achievements and tournament medals.</p>
        </div>
        <ReportExportBar
          reportKey="medals"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      {counts && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ReportStatCard label="Gold" value={counts.Gold ?? 0} accent="text-amber-600" />
          <ReportStatCard label="Silver" value={counts.Silver ?? 0} accent="text-slate-500" />
          <ReportStatCard label="Bronze" value={counts.Bronze ?? 0} accent="text-orange-700" />
          <ReportStatCard label="Total" value={counts.Total ?? 0} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search player / event…" />
        <select
          className={`${reportInputClass} max-w-[10rem]`}
          value={medal}
          onChange={(e) => setMedal(e.target.value)}
        >
          <option value="">All medals</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>
        <input
          type="number"
          className={`${reportInputClass} w-28`}
          placeholder={String(cy.year)}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'player', label: 'Player' },
          { key: 'registrationNumber', label: 'Reg No' },
          { key: 'tournament', label: 'Tournament' },
          {
            key: 'medal',
            label: 'Medal',
            render: (r) => medalBadge(r.medal),
          },
          { key: 'category', label: 'Category' },
          { key: 'date', label: 'Date' },
          { key: 'source', label: 'Source' },
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
