import { useEffect, useState } from 'react';
import SearchBar from '../SearchBar';
import { reportsService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import { ReportExportBar, ReportStatCard, reportInputClass } from './reportUi';

export default function WeightCategoryReportPanel() {
  const toast = useToast();
  const { can } = usePermissions();
  const canExport = can('reports.export');
  const canPrint = can('reports.print');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState({});

  const filters = {
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await reportsService.weightCategories(filters);
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Failed to load weight categories'));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, status]);

  const groups = data?.groups || [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Weight category report</h2>
          <p className="mt-1 text-sm text-muted">Players grouped by weight class.</p>
        </div>
        <ReportExportBar
          reportKey="weight-category"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
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

      {data && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ReportStatCard label="Groups" value={data.totalGroups ?? 0} />
          <ReportStatCard label="Players" value={data.totalPlayers ?? 0} />
        </div>
      )}

      {loading ? (
        <p className="mt-8 text-center text-muted">Loading…</p>
      ) : !groups.length ? (
        <p className="mt-8 text-center text-muted">No groups</p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((g) => {
            const key = g.category;
            const isOpen = open[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-100 bg-white shadow-sm"
              >
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                  onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
                >
                  <span className="font-semibold text-ink">{g.category}</span>
                  <span className="text-sm tabular-nums text-muted">
                    {g.totalPlayers} player{g.totalPlayers === 1 ? '' : 's'}
                  </span>
                </button>
                {isOpen && (
                  <ul className="border-t border-slate-50 px-4 py-2 text-sm">
                    {(g.players || []).map((p) => (
                      <li
                        key={p.id || p._id}
                        className="grid grid-cols-3 gap-2 border-b border-slate-50 py-2 last:border-0"
                      >
                        <span className="text-ink">
                          {p.fullName}
                          <span className="ml-2 text-muted">{p.registrationNumber}</span>
                        </span>
                        <span className="text-muted">
                          {p.ageCategoryLabel || p.resolvedAgeCategory || '—'}
                        </span>
                        <span className="text-right text-muted">{p.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
