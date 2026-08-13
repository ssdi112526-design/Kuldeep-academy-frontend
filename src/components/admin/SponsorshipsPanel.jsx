import { useEffect, useState } from 'react';
import { FaEdit, FaFileAlt, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { sponsorshipService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { inr } from '../../utils/financeUi';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

const EMPTY = {
  sponsorName: '',
  sponsorshipType: '',
  amount: '',
  startDate: '',
  endDate: '',
  status: 'Active',
  notes: '',
};

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
      {s}
    </span>
  );
}

export default function SponsorshipsPanel() {
  const toast = useToast();
  const { can, canModule, isSuperAdmin } = usePermissions();
  const canView = isSuperAdmin || canModule('sponsorships');
  const canCreate = isSuperAdmin || can('sponsorships.create');
  const canEdit = isSuperAdmin || can('sponsorships.edit');
  const canDelete = isSuperAdmin || can('sponsorships.delete');
  const canDownload = isSuperAdmin || can('sponsorships.download') || can('sponsorships.view');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('');
  const [expiry, setExpiry] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = async (page = pagination.page) => {
    setLoading(true);
    try {
      const res = await sponsorshipService.list({
        page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        status: status || undefined,
        expiry: expiry || undefined,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, debouncedSearch, status, expiry, pagination.limit]);

  const openCreate = () => {
    setForm(EMPTY);
    setFile(null);
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({
      sponsorName: row.sponsorName || '',
      sponsorshipType: row.sponsorshipType || '',
      amount: row.amount ?? '',
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : '',
      status: row.status || 'Active',
      notes: row.notes || '',
    });
    setFile(null);
    setModal(row);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'create') {
        await sponsorshipService.create(form, file);
        toast.success('Sponsorship created');
      } else {
        await sponsorshipService.update(modal.id || modal._id, form, file);
        toast.success('Sponsorship updated');
      }
      setModal(null);
      load(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const downloadDoc = async (row) => {
    try {
      const res = await sponsorshipService.downloadDocument(row.id || row._id);
      triggerBlobDownload(
        new Blob([res.data]),
        row.documentName || `sponsorship-${row.sponsorName}.pdf`
      );
    } catch (err) {
      toast.error(await parseBlobError(err));
    }
  };

  const confirmDelete = async () => {
    try {
      await sponsorshipService.remove(deleteId);
      toast.success('Deleted');
      setDeleteId(null);
      load(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search sponsors…" />
        <div className="flex flex-wrap gap-2">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className={inputClass} value={expiry} onChange={(e) => setExpiry(e.target.value)}>
            <option value="">All expiry</option>
            <option value="expired">Expired</option>
            <option value="upcoming">Expiring / Upcoming</option>
          </select>
          {canCreate && (
            <Button type="button" className="rounded-lg text-sm" onClick={openCreate}>
              <FaPlus size={12} /> Add Sponsorship
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No sponsorships yet
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">{r.sponsorName}</td>
                  <td className="px-4 py-3">{r.sponsorshipType}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {r.startDate ? String(r.startDate).slice(0, 10) : '—'}
                    {r.endDate ? ` → ${String(r.endDate).slice(0, 10)}` : ''}
                    {r.isExpiringSoon ? (
                      <span className="mt-1 block font-semibold text-amber-600">Expiring soon</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{statusBadge(r.derivedStatus || r.status)}</td>
                  <td className="px-4 py-3">
                    {r.documentPath ? (
                      <button
                        type="button"
                        disabled={!canDownload}
                        onClick={() => downloadDoc(r)}
                        className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline disabled:opacity-50"
                      >
                        <FaFileAlt size={12} /> {r.documentName || 'View'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="rounded border border-slate-200 p-1.5 hover:bg-slate-50"
                        >
                          <FaEdit size={12} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteId(r.id)}
                          className="rounded border border-slate-200 p-1.5 text-red-600 hover:bg-red-50"
                        >
                          <FaTrash size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={(page) => {
          setPagination((p) => ({ ...p, page }));
          load(page);
        }}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={save}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">
              {modal === 'create' ? 'Add Sponsorship' : 'Edit Sponsorship'}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-muted">
                Sponsor / Company *
                <input
                  required
                  className={`mt-1 ${inputClass}`}
                  value={form.sponsorName}
                  onChange={(e) => setForm((f) => ({ ...f, sponsorName: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Type *
                <input
                  required
                  className={`mt-1 ${inputClass}`}
                  value={form.sponsorshipType}
                  onChange={(e) => setForm((f) => ({ ...f, sponsorshipType: e.target.value }))}
                  placeholder="Cash / Kit / Venue / Other"
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Amount
                <input
                  type="number"
                  min="0"
                  className={`mt-1 ${inputClass}`}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-medium text-muted">
                  Start date *
                  <input
                    type="date"
                    required
                    className={`mt-1 ${inputClass}`}
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </label>
                <label className="block text-xs font-medium text-muted">
                  End date
                  <input
                    type="date"
                    className={`mt-1 ${inputClass}`}
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </label>
              </div>
              <label className="block text-xs font-medium text-muted">
                Status
                <select
                  className={`mt-1 ${inputClass}`}
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Document (PDF / Word / Image)
                <input
                  type="file"
                  className={`mt-1 ${inputClass}`}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Notes
                <textarea
                  className={`mt-1 ${inputClass}`}
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete sponsorship?"
        message="This will soft-delete the sponsorship record."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
