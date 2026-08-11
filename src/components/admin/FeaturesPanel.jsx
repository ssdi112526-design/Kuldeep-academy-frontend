import { useEffect, useRef, useState } from 'react';
import {
  FaEdit,
  FaPlus,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
} from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { featureService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ImageUploader from './ImageUploader';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';

const ICON_OPTIONS = [
  'FaUsers',
  'FaIdCard',
  'FaClipboardCheck',
  'FaDumbbell',
  'FaChartLine',
  'FaTrophy',
  'FaChalkboardTeacher',
  'FaCreditCard',
];

const ICON_PREVIEW = {
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
};

const EMPTY = {
  titleEn: '',
  titleHi: '',
  descriptionEn: '',
  descriptionHi: '',
  icon: 'FaUsers',
  displayOrder: 0,
  isActive: true,
};

export default function FeaturesPanel({ onChanged }) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('features');
  const canCreate = can('features.create');
  const canEdit = can('features.edit');
  const canDelete = can('features.delete');
  const canUpload = can('features.upload');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const searchRef = useRef(debouncedSearch);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await featureService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { features, pagination: p } = res.data.data;
      setItems(features);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load features');
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
    setFile(null);
    setPreview('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setEditing(item);
    setForm({
      titleEn: item.titleEn || '',
      titleHi: item.titleHi || '',
      descriptionEn: item.descriptionEn || '',
      descriptionHi: item.descriptionHi || '',
      icon: item.icon || 'FaUsers',
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive,
    });
    setFile(null);
    setPreview(item.image ? mediaUrl(item.image) : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing && !canEdit) {
      toast.error('You do not have permission to edit features');
      return;
    }
    if (!editing && !canCreate) {
      toast.error('You do not have permission to create features');
      return;
    }
    if (file && !canUpload) {
      toast.error('You do not have permission to upload images');
      return;
    }
    if (
      !form.titleEn.trim() ||
      !form.titleHi.trim() ||
      !form.descriptionEn.trim() ||
      !form.descriptionHi.trim()
    ) {
      const message = 'English and Hindi titles and descriptions are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titleEn: form.titleEn.trim(),
        titleHi: form.titleHi.trim(),
        descriptionEn: form.descriptionEn.trim(),
        descriptionHi: form.descriptionHi.trim(),
        icon: form.icon.trim(),
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      if (editing) await featureService.update(editing._id || editing.id, payload, file);
      else await featureService.create(payload, file);
      clearPublicCache('features');
      toast.success(editing ? 'Feature updated' : 'Feature created');
      setModalOpen(false);
      fetchList(pagination.page);
      onChanged?.();
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
      toast.error('You do not have permission to edit features');
      return;
    }
    try {
      await featureService.update(item._id || item.id, {
        titleEn: item.titleEn,
        titleHi: item.titleHi,
        descriptionEn: item.descriptionEn,
        descriptionHi: item.descriptionHi,
        icon: item.icon || '',
        displayOrder: item.displayOrder,
        isActive: !item.isActive,
      });
      clearPublicCache('features');
      fetchList(pagination.page);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete features');
      return;
    }
    const deleteId = confirm.id;
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await featureService.remove(deleteId);
      setItems((prev) => prev.filter((item) => (item._id || item.id) !== deleteId));
      clearPublicCache('features');
      toast.success('Feature deleted');
      setConfirm({ open: false, id: null, loading: false });
      await fetchList(pagination.page);
      onChanged?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
      fetchList(pagination.page);
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search features..." />
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Add Feature
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
          <p className="p-8 text-center text-sm text-muted">No features yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Icon / Image</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const Icon = ICON_PREVIEW[item.icon] || FaUsers;
                return (
                  <tr key={item._id || item.id} className="border-t border-slate-50">
                    <td className="px-4 py-3">
                      {item.image ? (
                        <img
                          src={mediaUrl(item.image)}
                          alt=""
                          className="h-12 w-16 rounded-md object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Icon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.titleEn}</p>
                      <p className="line-clamp-1 text-xs text-muted">{item.descriptionEn}</p>
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
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
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
                          onClick={() =>
                            setConfirm({ open: true, id: item._id || item.id, loading: false })
                          }
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <FaTrash />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
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
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Feature' : 'Add Feature'}</h3>
            <FormErrorBanner message={formError} />
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Title (English)
                <input
                  required
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Title (Hindi)
                <input
                  required
                  value={form.titleHi}
                  onChange={(e) => setForm({ ...form, titleHi: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Description (English)
                <textarea
                  required
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Description (Hindi)
                <textarea
                  required
                  rows={3}
                  value={form.descriptionHi}
                  onChange={(e) => setForm({ ...form, descriptionHi: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Icon
                <select
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                >
                  {ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
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
                />
                Active
              </label>
              <ImageUploader
                previewUrl={file ? URL.createObjectURL(file) : preview}
                onChange={(f) => {
                  if (!canUpload) {
                    toast.error('You do not have permission to upload images');
                    return;
                  }
                  setFile(f);
                  setPreview(URL.createObjectURL(f));
                }}
                onClear={() => {
                  setFile(null);
                  setPreview('');
                }}
                label="Optional image"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message="This will also remove any uploaded image."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
