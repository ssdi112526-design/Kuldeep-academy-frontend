import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { achievementService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';

const EMPTY = { labelEn: '', labelHi: '', value: 0, suffix: '+', displayOrder: 0, isActive: true };

export default function AchievementsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('achievements');
  const canCreate = can('achievements.create');
  const canEdit = can('achievements.edit');
  const canDelete = can('achievements.delete');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const searchRef = useRef(debouncedSearch);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await achievementService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { achievements, pagination: p } = res.data.data;
      setItems(achievements);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchRef.current !== debouncedSearch && pagination.page !== 1) {
      searchRef.current = debouncedSearch;
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    searchRef.current = debouncedSearch;
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearch]);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setEditing(item);
    setForm({
      labelEn: item.labelEn || '',
      labelHi: item.labelHi || '',
      value: item.value ?? 0,
      suffix: item.suffix || '+',
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing && !canEdit) {
      toast.error('You do not have permission to edit achievements');
      return;
    }
    if (!editing && !canCreate) {
      toast.error('You do not have permission to create achievements');
      return;
    }
    if (!form.labelEn.trim() || !form.labelHi.trim()) {
      const message = 'English and Hindi labels are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        labelEn: form.labelEn.trim(),
        labelHi: form.labelHi.trim(),
        value: Number(form.value) || 0,
        suffix: form.suffix || '+',
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) await achievementService.update(editing._id, payload);
      else await achievementService.create(payload);
      toast.success(editing ? 'Achievement updated' : 'Achievement created');
      setModalOpen(false);
      fetchList(pagination.page);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Save failed');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    if (!canEdit) {
      toast.error('You do not have permission to edit achievements');
      return;
    }
    try {
      await achievementService.update(item._id, { isActive: !item.isActive });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete achievements');
      return;
    }
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await achievementService.remove(confirm.id);
      toast.success('Achievement deleted');
      setConfirm({ open: false, id: null, loading: false });
      await fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search achievements..." />
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Add Achievement
          </Button>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No achievements yet. Add your first stat.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Label (EN / HI)</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.labelEn}</p>
                    <p className="text-xs text-muted">{item.labelHi}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-ink">
                    {item.value}
                    {item.suffix}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.displayOrder}</td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="mr-2 rounded-lg p-2 text-brand hover:bg-brand/10"
                        aria-label="Edit"
                      >
                        <FaEdit />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirm({ open: true, id: item._id, loading: false })}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && items.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Achievement' : 'Add Achievement'}</h3>
            <FormErrorBanner message={formError} />
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Label (English)
                <input
                  required
                  value={form.labelEn}
                  onChange={(e) => setForm({ ...form, labelEn: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Label (Hindi)
                <input
                  required
                  value={form.labelHi}
                  onChange={(e) => setForm({ ...form, labelHi: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-ink">
                  Value
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) || 0 })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Suffix
                  <input
                    value={form.suffix}
                    onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                    placeholder="+"
                  />
                </label>
              </div>
              <label className="block text-sm font-medium text-ink">
                Display Order
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Active (visible on website)
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-lg px-4 py-2 text-sm">
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete achievement?"
        message="This will remove the achievement from the website."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
