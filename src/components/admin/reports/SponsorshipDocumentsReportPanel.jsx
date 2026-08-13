import { useEffect, useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import Button from '../../ui/Button';
import SearchBar from '../SearchBar';
import Pagination from '../Pagination';
import AccessDenied from '../AccessDenied';
import { reportsService, sponsorshipService } from '../../../services';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { getApiErrorMessage } from '../../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../../utils/downloadBlob';
import { inr } from '../../../utils/financeUi';
import useDebouncedValue from '../../../hooks/useDebouncedValue';
import {
  ReportExportBar,
  ReportTable,
  reportInputClass,
} from './reportUi';

const STATUS_OPTIONS = ['Active', 'Upcoming', 'Expired', 'Cancelled'];

function statusBadge(status) {
  const s = String(status || '');
  const cls =
    s === 'Active'
      ? 'bg-emerald-100 text-emerald-800'
      : s === 'Upcoming'
        ? 'bg-sky-100 text-sky-800'
        : s === 'Expired'
          ? 'bg-red-100 text-red-800'
          : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {s || '—'}
    </span>
  );
}

export default function SponsorshipDocumentsReportPanel() {
  const toast = useToast();
  const { can, canModule, isSuperAdmin } = usePermissions();
  const canView =
    isSuperAdmin ||
    canModule('sponsorships') ||
    canModule('reports') ||
    can('sponsorships.view');
  const canExport = can('reports.export') || can('sponsorships.export');
  const canPrint = can('reports.print');
  const canDownload =
    isSuperAdmin || can('sponsorships.download') || can('sponsorships.view') || canModule('reports');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('');
  const [expiry, setExpiry] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const filters = {
    search: debouncedSearch.trim() || undefined,
    status: status || undefined,
    expiry: expiry || undefined,
  };

  const load = async (page = pagination.page) => {
    if (!canView) return;
    setLoading(true);
    try {
      const res = await reportsService.sponsorships({
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
      toast.error(getApiErrorMessage(err, 'Failed to load sponsorships'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, debouncedSearch, status, expiry, pagination.limit]);

  const downloadDoc = async (row) => {
    if (!canDownload) {
      toast.error('No download permission');
      return;
    }
    try {
      const res = await sponsorshipService.downloadDocument(row.id || row._id);
      triggerBlobDownload(
        new Blob([res.data]),
        row.documentName || `sponsorship-${row.sponsorName || 'doc'}.pdf`
      );
    } catch (err) {
      toast.error(await parseBlobError(err));
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Sponsorship documents</h2>
          <p className="mt-1 text-sm text-muted">Sponsors, status and attached documents.</p>
        </div>
        <ReportExportBar
          reportKey="sponsorships"
          filters={filters}
          canExport={canExport}
          canPrint={canPrint}
          toast={toast}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sponsors…" />
        <select
          className={`${reportInputClass} max-w-[10rem]`}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className={`${reportInputClass} max-w-[12rem]`}
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        >
          <option value="">Any expiry</option>
          <option value="upcoming">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <ReportTable
        loading={loading}
        rows={rows}
        columns={[
          { key: 'sponsorName', label: 'Sponsor' },
          { key: 'sponsorshipType', label: 'Type' },
          {
            key: 'amount',
            label: 'Amount',
            render: (r) => inr(r.amount),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => statusBadge(r.derivedStatus || r.status),
          },
          {
            key: 'endDate',
            label: 'End date',
            render: (r) => (r.endDate ? String(r.endDate).slice(0, 10) : '—'),
          },
          {
            key: 'document',
            label: 'Document',
            render: (r) =>
              r.documentName || r.documentPath ? (
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-lg px-3 py-1.5 text-xs"
                  disabled={!canDownload}
                  onClick={() => downloadDoc(r)}
                >
                  <FaDownload size={10} /> {r.documentName || 'Download'}
                </Button>
              ) : (
                '—'
              ),
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
