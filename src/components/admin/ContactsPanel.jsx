import { useEffect, useRef, useState } from 'react';
import { FaClipboardList, FaCalendarDay, FaEnvelopeOpenText } from 'react-icons/fa';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { contactService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import StatCard from './StatCard';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';
import BulkActionsBar from './BulkActionsBar';
import DataTable from './DataTable';
import Pagination from './Pagination';
import ViewModal from './ViewModal';
import AccessDenied from './AccessDenied';

const EMPTY_FILTERS = { dateFilter: '', startDate: '', endDate: '', status: '' };
const MIME_TYPES = {
  csv: 'text/csv',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export default function ContactsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('inquiries');
  const canDelete = can('inquiries.delete');
  const canExport = can('inquiries.export');
  const [contacts, setContacts] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, targetId: null, loading: false });
  const [viewingContact, setViewingContact] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState({ totalContacts: 0, todayContacts: 0, statusBreakdown: {} });
  const [statsLoading, setStatsLoading] = useState(true);

  const filtersKey = JSON.stringify({ debouncedSearch, ...filters });
  const prevFiltersKeyRef = useRef(filtersKey);

  const buildParams = (page) => ({
    page,
    limit: pagination.limit,
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    ...(filters.status && { status: filters.status }),
    ...(filters.dateFilter && { dateFilter: filters.dateFilter }),
    ...(filters.dateFilter === 'custom' && filters.startDate && { startDate: filters.startDate }),
    ...(filters.dateFilter === 'custom' && filters.endDate && { endDate: filters.endDate }),
  });

  const fetchContacts = async (page) => {
    setListLoading(true);
    setListError('');
    try {
      const res = await contactService.list(buildParams(page));
      const { contacts: list, pagination: p } = res.data.data;
      setContacts(list);
      setPagination((prev) => ({ ...prev, total: p.total, pages: p.pages, page: p.page }));
      return list;
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load records');
      return [];
    } finally {
      setListLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await contactService.stats();
      setStats(res.data.data);
    } catch {
      /* ignore */
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey;
    prevFiltersKeyRef.current = filtersKey;
    if (filtersChanged && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    fetchContacts(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filtersKey]);

  const toggleRow = (id) => {
    if (!canDelete && !canExport) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllOnPage = () => {
    if (!canDelete && !canExport) return;
    const pageIds = contacts.map((c) => c._id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleConfirmDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete inquiries');
      return;
    }
    setConfirmState((s) => ({ ...s, loading: true }));
    try {
      if (confirmState.mode === 'single') {
        await contactService.remove(confirmState.targetId);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(confirmState.targetId);
          return next;
        });
        toast.success('Record deleted successfully');
      } else {
        const ids = [...selectedIds];
        await contactService.bulkDelete(ids);
        setSelectedIds(new Set());
        toast.success(`${ids.length} record(s) deleted successfully`);
      }
      setConfirmState({ open: false, mode: null, targetId: null, loading: false });
      const remaining = await fetchContacts(pagination.page);
      if (remaining.length === 0 && pagination.page > 1) {
        setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
      }
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setConfirmState((s) => ({ ...s, loading: false }));
    }
  };

  const handleExport = async (format) => {
    if (!canExport) {
      toast.error('You do not have permission to export inquiries');
      return;
    }
    if (selectedIds.size === 0) {
      toast.error('Please select at least one record.');
      return;
    }
    setExporting(true);
    try {
      const res = await contactService.exportRecords({ ids: [...selectedIds], format });
      const blob = new Blob([res.data], { type: MIME_TYPES[format] });
      triggerBlobDownload(blob, `contacts-${new Date().toISOString().slice(0, 10)}.${format}`);
      toast.success('Export downloaded successfully');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Records" value={stats.totalContacts} icon={FaClipboardList} loading={statsLoading} />
        <StatCard label="Today's Records" value={stats.todayContacts} icon={FaCalendarDay} loading={statsLoading} />
        <StatCard
          label="New / Unresolved"
          value={stats.statusBreakdown?.new ?? 0}
          icon={FaEnvelopeOpenText}
          loading={statsLoading}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mt-4">
        <BulkActionsBar
          count={selectedIds.size}
          onExport={handleExport}
          onBulkDelete={() => {
            if (selectedIds.size === 0) {
              toast.error('Please select at least one record.');
              return;
            }
            setConfirmState({ open: true, mode: 'bulk', targetId: null, loading: false });
          }}
          onClear={() => setSelectedIds(new Set())}
          exporting={exporting}
          canExport={canExport}
          canDelete={canDelete}
        />
      </div>

      <DataTable
        contacts={contacts}
        loading={listLoading}
        error={listError}
        page={pagination.page}
        limit={pagination.limit}
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAllOnPage={toggleAllOnPage}
        onView={setViewingContact}
        onDeleteOne={canDelete ? (id) => setConfirmState({ open: true, mode: 'single', targetId: id, loading: false }) : undefined}
        canSelect={canDelete || canExport}
        canDelete={canDelete}
      />

      {!listLoading && !listError && contacts.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) =>
            setPagination((prev) => ({ ...prev, page: Math.min(Math.max(1, page), prev.pages) }))
          }
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        />
      )}

      <ConfirmDialog
        open={confirmState.open}
        title="Are you sure you want to delete this record?"
        message={
          confirmState.mode === 'bulk'
            ? `This will permanently delete ${selectedIds.size} selected record(s).`
            : 'This action cannot be undone.'
        }
        confirmLabel="Delete"
        danger
        loading={confirmState.loading}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, mode: null, targetId: null, loading: false })}
      />

      <ViewModal contact={viewingContact} onClose={() => setViewingContact(null)} />
    </div>
  );
}
