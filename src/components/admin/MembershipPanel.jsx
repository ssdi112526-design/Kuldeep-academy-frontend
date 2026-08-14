import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { membershipService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ImageUploader from './ImageUploader';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';
import {
  fieldClass,
  firstErrorMessage,
  requiredText,
  validateInt4,
} from '../../utils/formValidation';

const EMPTY = {
  name: '',
  description: '',
  priceLabel: '',
  benefits: '',
  displayOrder: 0,
  isActive: true,
};

function benefitsToTextarea(value) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join('\n');
  } catch {
    /* plain text */
  }
  return String(value);
}

function benefitsFromTextarea(value) {
  const lines = String(value || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
  return lines.length ? JSON.stringify(lines) : '';
}

export default function MembershipPanel({ onChanged }) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('membership');
  const canCreate = can('membership.create');
  const canEdit = can('membership.edit');
  const canDelete = can('membership.delete');
  const canUpload = can('membership.upload');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const searchRef = useRef(debouncedSearch);

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await membershipService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { membershipPlans, pagination: p } = res.data.data;
      setItems(membershipPlans);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load membership plans');
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
    setFieldErrors({});
    setFile(null);
    setPreview('');
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      priceLabel: item.priceLabel || '',
      benefits: benefitsToTextarea(item.benefits),
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive,
    });
    setFieldErrors({});
    setFile(null);
    setPreview(item.image ? mediaUrl(item.image) : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing && !canEdit) {
      toast.error('You do not have permission to edit membership plans');
      return;
    }
    if (!editing && !canCreate) {
      toast.error('You do not have permission to create membership plans');
      return;
    }
    if (file && !canUpload) {
      toast.error('You do not have permission to upload images');
      return;
    }
    const errors = {};
    const name = requiredText(form.name, 'Plan name');
    const description = requiredText(form.description, 'Description', 1, 5000);
    const displayOrder = validateInt4(form.displayOrder, 'Display order', { required: false });
    if (name) errors.name = name;
    if (description) errors.description = description;
    if (displayOrder) errors.displayOrder = displayOrder;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, ['name', 'description', 'displayOrder']);
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        priceLabel: form.priceLabel.trim(),
        benefits: benefitsFromTextarea(form.benefits),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) await membershipService.update(editing._id || editing.id, payload, file);
      else await membershipService.create(payload, file);
      clearPublicCache('membership-plans');
      toast.success(editing ? 'Membership plan updated' : 'Membership plan created');
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
      toast.error('You do not have permission to edit membership plans');
      return;
    }
    try {
      await membershipService.update(item._id || item.id, {
        name: item.name,
        description: item.description,
        priceLabel: item.priceLabel || '',
        benefits: item.benefits || '',
        displayOrder: item.displayOrder,
        isActive: !item.isActive,
      });
      clearPublicCache('membership-plans');
      fetchList(pagination.page);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete membership plans');
      return;
    }
    const deleteId = confirm.id;
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await membershipService.remove(deleteId);
      setItems((prev) => prev.filter((item) => (item._id || item.id) !== deleteId));
      clearPublicCache('membership-plans');
      toast.success('Membership plan deleted');
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
        <SearchBar value={search} onChange={setSearch} placeholder="Search membership plans..." />
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Add Plan
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
          <p className="p-8 text-center text-sm text-muted">No membership plans yet.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
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
                      <div className="flex h-12 w-16 items-center justify-center rounded-md bg-slate-100 text-xs text-muted">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="line-clamp-1 text-xs text-muted">{item.description}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.priceLabel || '—'}</td>
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
            <h3 className="text-lg font-bold text-ink">
              {editing ? 'Edit Membership Plan' : 'Add Membership Plan'}
            </h3>
            <FormErrorBanner message={formError} />
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Plan Name
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={fieldClass(fieldErrors, 'name')}
                />
                {fieldErrors.name ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.name}</span>
                ) : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Description
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={fieldClass(fieldErrors, 'description')}
                />
                {fieldErrors.description ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.description}</span>
                ) : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Price Label
                <input
                  value={form.priceLabel}
                  onChange={(e) => updateField('priceLabel', e.target.value)}
                  placeholder="e.g. ₹2,000 / month"
                  className={fieldClass(fieldErrors, 'priceLabel')}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Benefits (one per line)
                <textarea
                  rows={4}
                  value={form.benefits}
                  onChange={(e) => updateField('benefits', e.target.value)}
                  className={fieldClass(fieldErrors, 'benefits')}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Display Order
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => updateField('displayOrder', e.target.value)}
                  className={fieldClass(fieldErrors, 'displayOrder')}
                />
                {fieldErrors.displayOrder ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.displayOrder}</span>
                ) : null}
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateField('isActive', e.target.checked)}
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
