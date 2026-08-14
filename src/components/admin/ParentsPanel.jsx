import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import FormErrorBanner from './FormErrorBanner';
import AccessDenied from './AccessDenied';
import ImageUploader from './ImageUploader';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { entryService, parentAdminService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { mediaUrl } from '../../utils/mediaUrl';

const EMPTY = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  relation: 'Parent',
  studentIds: [],
  isActive: true,
};

export default function ParentsPanel({ focusId = null, focusToken = null } = {}) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('students');
  const canCreate = can('students.create');
  const canEdit = can('students.edit') || canCreate;
  const canDelete = can('students.delete') || canCreate;

  const [items, setItems] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [photoFile, setPhotoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [highlightedId, setHighlightedId] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null, name: '', loading: false });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await parentAdminService.list();
      setItems(res.data?.data?.parents || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load parent accounts'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) load();
    entryService.students
      .list({ page: 1, limit: 200 })
      .then((res) => setPlayers(res.data?.data?.students || []))
      .catch(() => setPlayers([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  useEffect(() => {
    if (!focusId || !canView) return;
    setHighlightedId(focusId);
    const t = setTimeout(() => {
      const el = document.getElementById(`parent-row-${focusId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => clearTimeout(t);
  }, [focusId, focusToken, canView]);

  if (!canView) return <AccessDenied />;

  const toggleStudent = (id) => {
    setForm((f) => ({
      ...f,
      studentIds: f.studentIds.includes(id)
        ? f.studentIds.filter((x) => x !== id)
        : [...f.studentIds, id],
    }));
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setPhotoFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (parent) => {
    if (!canEdit) return;
    setEditing(parent);
    setForm({
      fullName: parent.fullName || '',
      email: parent.email || parent.user?.email || '',
      password: '',
      phone: parent.phone || '',
      relation: parent.relation || 'Parent',
      studentIds: (parent.links || []).map((l) => l.studentId || l.student?.id || l.student?._id).filter(Boolean),
      isActive: parent.user?.isActive !== false,
    });
    setPhotoFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const needsPassword = !editing;
    if (!form.fullName.trim() || !form.email.trim() || !form.studentIds.length) {
      const message = 'Name, email and at least one linked player are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (needsPassword && !form.password) {
      const message = 'Temporary password is required';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (form.password && form.password.length < 6) {
      const message = 'Password must be at least 6 characters';
      setFormError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        relation: form.relation.trim(),
        studentIds: form.studentIds,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;

      if (editing) {
        await parentAdminService.update(editing._id || editing.id, payload, photoFile);
        toast.success('Parent account updated');
      } else {
        await parentAdminService.create({ ...payload, password: form.password }, photoFile);
        toast.success('Parent account created');
      }
      setModalOpen(false);
      setEditing(null);
      setForm(EMPTY);
      setPhotoFile(null);
      load();
    } catch (err) {
      const message = getApiErrorMessage(err, editing ? 'Failed to update parent' : 'Failed to create parent');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await parentAdminService.remove(confirm.id);
      toast.success('Parent account deleted');
      setConfirm({ open: false, id: null, name: '', loading: false });
      load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete parent'));
      setConfirm((c) => ({ ...c, loading: false }));
    }
  };

  const existingPhoto = editing ? mediaUrl(editing.photo || editing.user?.profileImage) : '';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Create parent logins linked to one or more players. Parents only see their linked children.
        </p>
        {canCreate ? (
          <Button onClick={openCreate} className="inline-flex items-center gap-2">
            <FaPlus /> Add Parent
          </Button>
        ) : null}
      </div>

      {error ? <FormErrorBanner message={error} /> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-muted">
          No parent accounts yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Linked players</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const pid = p._id || p.id;
                const isFocus = highlightedId && highlightedId === pid;
                return (
                  <tr
                    key={pid}
                    id={`parent-row-${pid}`}
                    className={`border-b border-slate-50 ${isFocus ? 'bg-brand/10 ring-2 ring-inset ring-brand/30' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={mediaUrl(p.photo || p.user?.profileImage)}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover bg-slate-100"
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.fullName}</p>
                      <p className="text-xs text-muted">{p.relation || 'Parent'}</p>
                      {isFocus ? (
                        <p className="mt-1 text-[11px] font-semibold text-brand">Opened from global search</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p>{p.email || p.user?.email}</p>
                      <p className="text-xs text-muted">{p.phone || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {(p.links || []).map((link) => (
                          <span
                            key={link._id || link.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs"
                          >
                            {link.student?.photo ? (
                              <img
                                src={mediaUrl(link.student.photo)}
                                alt=""
                                className="h-5 w-5 rounded object-cover"
                              />
                            ) : null}
                            {link.student?.fullName}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">{p.user?.isActive === false ? 'Inactive' : 'Active'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                            aria-label="Edit"
                            onClick={() => openEdit(p)}
                          >
                            <FaEdit />
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label="Delete"
                            onClick={() =>
                              setConfirm({
                                open: true,
                                id: pid,
                                name: p.fullName || p.email || 'this parent',
                                loading: false,
                              })
                            }
                          >
                            <FaTrash />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={handleSave}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">
              {editing ? 'Edit Parent Account' : 'Create Parent Account'}
            </h3>
            <div className="mt-3">
              <FormErrorBanner message={formError} />
            </div>
            <div className="mt-4 grid gap-3">
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Parent Image</p>
                <ImageUploader
                  label="Upload parent image (JPG/PNG/WEBP)"
                  value={photoFile}
                  previewUrl={!photoFile ? existingPhoto : ''}
                  onChange={setPhotoFile}
                  onClear={() => setPhotoFile(null)}
                />
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Full name *</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Email (login) *</span>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">
                  {editing ? 'New password (optional)' : 'Temporary password *'}
                </span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required={!editing}
                  minLength={editing ? undefined : 6}
                  placeholder={editing ? 'Leave blank to keep current password' : ''}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Phone</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Relation</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={form.relation}
                    onChange={(e) => setForm((f) => ({ ...f, relation: e.target.value }))}
                  />
                </label>
              </div>
              {editing ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span className="font-medium text-ink">Account active</span>
                </label>
              ) : null}
              <div>
                <p className="mb-2 text-sm font-medium text-ink">Link players *</p>
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {players.map((p) => {
                    const id = p._id || p.id;
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={form.studentIds.includes(id)}
                          onChange={() => toggleStudent(id)}
                        />
                        <span>
                          {p.fullName} <span className="text-muted">({p.registrationNumber})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Delete parent account?"
        message={`This will permanently delete ${confirm.name} and their login. Linked players are not deleted.`}
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: '', loading: false })}
      />
    </div>
  );
}
