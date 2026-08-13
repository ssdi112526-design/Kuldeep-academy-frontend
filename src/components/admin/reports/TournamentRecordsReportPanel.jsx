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
  ReportTable,
  medalBadge,
  reportInputClass,
  currentMonthYear,
} from './reportUi';

export default function TournamentRecordsReportPanel() {
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
      const res = await reportsService.tournaments({
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
      toast.error(getApiErrorMessage(err, 'Failed to load tournaments'));
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
          <h2 className="text-lg font-bold text-ink">Tournament records</h2>
          <p className="mt-1 text-sm text-muted">Participation, results and medals.</p>
        </div>
        <ReportExportBar
          reportKey="tournaments"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tournament / player…" />
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
          { key: 'tournamentName', label: 'Tournament' },
          { key: 'date', label: 'Date' },
          { key: 'location', label: 'Location' },
          { key: 'player', label: 'Player' },
          { key: 'category', label: 'Category' },
          { key: 'weightCategory', label: 'Weight' },
          { key: 'result', label: 'Result' },
          { key: 'position', label: 'Position' },
          {
            key: 'medal',
            label: 'Medal',
            render: (r) => medalBadge(r.medal),
          },
          { key: 'remarks', label: 'Remarks' },
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
