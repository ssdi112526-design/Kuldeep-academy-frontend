import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { athleteService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ImageUploader from './ImageUploader';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';

const EMPTY = {
  name: '',
  category: 'Wrestling',
  objectPosition: 'top',
  displayOrder: 0,
  isActive: true,
};

const POSITION_OPTIONS = [
  { value: 'top', label: 'Top (face focus)' },
  { value: 'center', label: 'Center' },
  { value: 'center 20%', label: 'Upper center' },
  { value: 'bottom', label: 'Bottom' },
];

export default function AthletesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('athletes');
  const canCreate = can('athletes.create');
  const canEdit = can('athletes.edit');
  const canDelete = can('athletes.delete');
  const canUpload = can('athletes.upload');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
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
      const res = await athleteService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { athletes, pagination: p } = res.data.data;
      setItems(athletes || []);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load athletes'));
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
      name: item.name || '',
      category: item.category || '',
      objectPosition: item.objectPosition || 'top',
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive !== false,
    });
    setFile(null);
    setPreview(item.image ? mediaUrl(item.image) : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category.trim()) {
      const message = 'Name and category are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (file && !canUpload) {
      toast.error('You do not have permission to upload images');
      return;
    }
    if (!editing && !file) {
      const message = 'Please upload an athlete image';
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        objectPosition: form.objectPosition || 'top',
        displayOrder: form.displayOrder,
        isActive: form.isActive,
      };
      if (editing) await athleteService.update(editing._id || editing.id, payload, file);
      else await athleteService.create(payload, file);
      clearPublicCache('athletes');
      toast.success(editing ? 'Athlete updated' : 'Athlete added — visible on Meet Our Wrestlers');
      setModalOpen(false);
      fetchList(editing ? pagination.page : 1);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Save failed');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item) => {
    if (!canEdit) return;
    try {
      await athleteService.update(item._id || item.id, {
        name: item.name,
        category: item.category,
        objectPosition: item.objectPosition || '',
        displayOrder: item.displayOrder,
        isActive: !item.isActive,
      });
      clearPublicCache('athletes');
      toast.success(item.isActive ? 'Hidden from website' : 'Shown on website');
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Toggle failed'));
    }
  };

  const handleDelete = async () => {
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await athleteService.remove(confirm.id);
      clearPublicCache('athletes');
      toast.success('Athlete deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search athletes..." />
        {canCreate ? (
          <Button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Add Athlete
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
          <p className="p-8 text-center text-sm text-muted">
            No athletes yet. Add wrestler photos here to show on the public “Meet Our Wrestlers” section.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Website</th>
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
                        className="h-14 w-11 rounded-md object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-14 w-11 items-center justify-center rounded-md bg-slate-100 text-[10px] text-muted">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{item.name}</td>
                  <td className="px-4 py-3 text-muted">{item.category}</td>
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
                        {item.isActive ? 'Visible' : 'Hidden'}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isActive ? 'Visible' : 'Hidden'}
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

      {!loading && items.length > 0 ? (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        />
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Athlete' : 'Add Athlete'}</h3>
            <p className="mt-1 text-xs text-muted">
              These photos appear in the public “Meet Our Wrestlers” section.
            </p>
            <div className="mt-3">
              <FormErrorBanner message={formError} />
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Athlete name *
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  placeholder="e.g. Hemant Kashyap"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Category label *
                <input
                  required
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  placeholder="Wrestling / Training / Competition"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-ink">
                  Display order
                  <input
                    type="number"
                    value={form.displayOrder}
                    onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Image focus
                  <select
                    value={form.objectPosition}
                    onChange={(e) => setForm({ ...form, objectPosition: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  >
                    {POSITION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <ImageUploader
                label="Athlete photo *"
                value={file}
                onChange={setFile}
                previewUrl={preview}
                onClear={() => {
                  setFile(null);
                  if (!editing?.image) setPreview('');
                }}
              />
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Show on website
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Delete athlete?"
        message="This will remove the athlete from the public website."
        confirmLabel="Delete"
        loading={confirm.loading}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
