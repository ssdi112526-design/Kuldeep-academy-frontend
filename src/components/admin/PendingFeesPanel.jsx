import { useEffect, useRef, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import Button from '../ui/Button';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { mediaUrl } from '../../utils/mediaUrl';
import { inr, feeStatusClass } from '../../utils/financeUi';
import { toPagination } from '../../utils/financePagination';

function pagesOf(total, limit) {
  return Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 20)));
}

export default function PendingFeesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canExport = can('finance.export');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [exporting, setExporting] = useState(false);

  const filtersKey = JSON.stringify({ debouncedSearch });
  const prevFiltersKeyRef = useRef(filtersKey);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await financeService.listPending({
        page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
      });
      const data = res.data.data;
      const total = data.total ?? 0;
      const limit = data.limit ?? pagination.limit;
      setRows(data.rows || []);
      setPagination((prev) => ({
        ...prev,
        page: data.page || page,
        limit,
        total,
        pages: pagesOf(total, limit),
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load pending fees'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey;
    prevFiltersKeyRef.current = filtersKey;
    if (filtersChanged && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, pagination.page, pagination.limit, filtersKey]);

  const handleExport = async (format) => {
    if (!canExport) {
      toast.error('You do not have permission to export');
      return;
    }
    setExporting(true);
    try {
      const res = await financeService.exportPending({
        format,
        search: debouncedSearch.trim() || undefined,
      });
      const mime =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      triggerBlobDownload(
        new Blob([res.data], { type: mime }),
        `pending-fees-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search pending by name, reg no…"
        />
        {canExport && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={exporting}
              onClick={() => handleExport('xlsx')}
            >
              <FaDownload size={12} /> Excel
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={exporting}
              onClick={() => handleExport('csv')}
            >
              <FaDownload size={12} /> CSV
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Month</th>
              <th className="px-4 py-3 font-semibold">Fee</th>
              <th className="px-4 py-3 font-semibold">Paid</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted">
                  No pending fees
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.student?.photo ? (
                        <img
                          src={mediaUrl(r.student.photo)}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-muted">
                          {(r.student?.fullName || '?').slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{r.student?.fullName}</p>
                        <p className="text-xs text-muted">{r.student?.registrationNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.monthLabel}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.feeAmount)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.paidAmount)}</td>
                  <td className="px-4 py-3 tabular-nums font-medium text-ink">{inr(r.remainingDue)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${feeStatusClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />
    </div>
  );
}
