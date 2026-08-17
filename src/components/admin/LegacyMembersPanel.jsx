import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { legacyMemberService } from '../../services';
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
  optionalText,
  requiredText,
  validateInt4,
} from '../../utils/formValidation';

const EMPTY = {
  name: '',
  designation: 'PRESTIGIOUS MEMBER',
  achievement: '',
  description: '',
  displayOrder: 0,
  isActive: true,
};

export default function LegacyMembersPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('legacy_members');
  const canCreate = can('legacy_members.create');
  const canEdit = can('legacy_members.edit');
  const canDelete = can('legacy_members.delete');
  const canUpload = can('legacy_members.upload');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
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
      const res = await legacyMemberService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(statusFilter !== 'all' && { active: statusFilter }),
      });
      const { members, pagination: p } = res.data.data;
      setItems(members || []);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load legacy members'));
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
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

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
      designation: item.designation || '',
      achievement: item.achievement || '',
      description: item.description || '',
      displayOrder: item.displayOrder ?? 0,
      isActive: item.isActive !== false,
    });
    setFieldErrors({});
    setFile(null);
    setPreview(item.image ? mediaUrl(item.image) : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (file && !canUpload) {
      toast.error('You do not have permission to upload images');
      return;
    }
    const errors = {};
    const name = requiredText(form.name, 'Member name', 2, 150);
    const designation = requiredText(form.designation, 'Designation', 1, 120);
    const description = requiredText(form.description, 'Description', 1, 2000);
    const achievement = optionalText(form.achievement, 'Achievement', 200);
    const displayOrder = validateInt4(form.displayOrder, 'Display order', { required: false });
    if (name) errors.name = name;
    if (designation) errors.designation = designation;
    if (description) errors.description = description;
    if (achievement) errors.achievement = achievement;
    if (displayOrder) errors.displayOrder = displayOrder;
    if (!editing && !file) errors.image = 'Please upload a member photo';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'name',
        'designation',
        'achievement',
        'description',
        'displayOrder',
        'image',
      ]);
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        designation: form.designation.trim(),
        achievement: form.achievement.trim(),
        description: form.description.trim(),
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
      };
      if (editing) await legacyMemberService.update(editing._id || editing.id, payload, file);
      else await legacyMemberService.create(payload, file);
      clearPublicCache('legacy-members');
      toast.success(editing ? 'Legacy member updated' : 'Legacy member added');
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
      await legacyMemberService.update(item._id || item.id, {
        name: item.name,
        designation: item.designation,
        achievement: item.achievement || '',
        description: item.description,
        displayOrder: item.displayOrder,
        isActive: !item.isActive,
      });
      clearPublicCache('legacy-members');
      toast.success(item.isActive ? 'Hidden from website' : 'Shown on website');
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Toggle failed'));
    }
  };

  const handleDelete = async () => {
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await legacyMemberService.remove(confirm.id);
      clearPublicCache('legacy-members');
      toast.success('Legacy member deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search members..." />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="all">All status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        {canCreate ? (
          <Button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Add Legacy Member
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
            No legacy members yet. Add members here to show on the public “Meet Our Prestigious Members”
            section.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Designation</th>
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
                      <div className="relative h-16 w-12 overflow-hidden rounded-md bg-slate-100">
                        <img
                          src={mediaUrl(item.image)}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover object-center"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="flex h-16 w-12 items-center justify-center rounded-md bg-slate-100 text-[10px] text-muted">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.name}</p>
                    {item.achievement ? (
                      <p className="text-xs text-muted">{item.achievement}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-muted">{item.designation}</td>
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
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
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

      {!loading && items.length > 0 ? (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        />
      ) : null}

      {modalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">
              {editing ? 'Edit Legacy Member' : 'Add Legacy Member'}
            </h3>
            <p className="mt-1 text-xs text-muted">
              These profiles appear in the public “Meet Our Prestigious Members” section.
            </p>
            <div className="mt-3">
              <FormErrorBanner message={formError} />
            </div>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Member Name *
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={fieldClass(fieldErrors, 'name')}
                  placeholder="e.g. Sakshi Malik"
                />
                {fieldErrors.name ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.name}</span>
                ) : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Designation / Label *
                <input
                  value={form.designation}
                  onChange={(e) => updateField('designation', e.target.value)}
                  className={fieldClass(fieldErrors, 'designation')}
                  placeholder="e.g. PRESTIGIOUS MEMBER"
                />
                {fieldErrors.designation ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.designation}</span>
                ) : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Achievement / Title
                <input
                  value={form.achievement}
                  onChange={(e) => updateField('achievement', e.target.value)}
                  className={fieldClass(fieldErrors, 'achievement')}
                  placeholder="e.g. Olympic Medalist"
                />
                {fieldErrors.achievement ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.achievement}</span>
                ) : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Description *
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={fieldClass(fieldErrors, 'description')}
                  placeholder="Connected with the academy’s wrestling legacy."
                />
                {fieldErrors.description ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.description}</span>
                ) : null}
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
                Active (visible on website)
              </label>

              {(canUpload || canCreate || canEdit) && (
                <div>
                  <ImageUploader
                    label={editing ? 'Replace member photo (JPG/PNG/WEBP)' : 'Member Photo *'}
                    value={file}
                    previewUrl={preview}
                    previewClassName="aspect-[4/5] w-40"
                    onChange={(f) => {
                      setFile(f);
                      if (fieldErrors.image) {
                        setFieldErrors((prev) => {
                          const next = { ...prev };
                          delete next.image;
                          return next;
                        });
                      }
                    }}
                    onClear={() => {
                      setFile(null);
                      if (!editing?.image) setPreview('');
                    }}
                  />
                  <p className="mt-1.5 text-[11px] text-muted">
                    Preview matches the public card ratio (4:5). Original file is kept unchanged.
                  </p>
                  {fieldErrors.image ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.image}</span>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Member' : 'Save Member'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Delete Legacy Member?"
        message="Are you sure you want to permanently remove this member?"
        confirmLabel="Delete"
        loading={confirm.loading}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
