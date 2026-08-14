import { useEffect, useMemo, useState } from 'react';
import {
  FaEdit,
  FaEye,
  FaKey,
  FaPlus,
  FaTrash,
  FaEyeSlash,
  FaRandom,
} from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { roleAdminService, userAdminService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import { usePermissions } from '../../context/PermissionContext';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';

const EMPTY = {
  name: '',
  username: '',
  email: '',
  mobile: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  isActive: true,
  sendWelcomeEmail: false,
};

function formatDate(value) {
  if (!value) return 0;
  try {
    return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return 0;
  }
}

export default function UsersPanel() {
  const toast = useToast();
  const { can, isSuperAdmin } = usePermissions();
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [roleId, setRoleId] = useState('');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [resetModal, setResetModal] = useState({ open: false, user: null, password: '', confirmPassword: '', loading: false });

  const canView = can('users.view');
  const canCreate = can('users.create');
  const canEdit = can('users.edit');
  const canDelete = can('users.delete');

  const roleOptions = useMemo(() => {
    if (isSuperAdmin) return roles;
    return roles.filter((r) => r.slug !== 'super_admin');
  }, [roles, isSuperAdmin]);

  const fetchRoles = async () => {
    try {
      const res = await roleAdminService.list({ limit: 100 });
      setRoles(res.data.data.roles || []);
    } catch {
      /* roles list may fail without roles.view — ignore for filters when possible */
    }
  };

  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const res = await userAdminService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(roleId && { roleId }),
        ...(status !== 'all' && { status }),
      });
      setItems(res.data.data.users || []);
      setPagination((p) => ({ ...p, ...res.data.data.pagination }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchRoles();
      fetchList(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, debouncedSearch, roleId, status]);

  if (!canView) {
    return <AccessDenied />;
  }

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setFile(null);
    setPreview('');
    setShowPassword(false);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({
      name: user.name || '',
      username: user.username || '',
      email: user.email || '',
      mobile: user.mobile || '',
      password: '',
      confirmPassword: '',
      roleId: user.roleId || '',
      isActive: user.isActive !== false,
      sendWelcomeEmail: false,
    });
    setFile(null);
    setPreview(user.profileImage ? mediaUrl(user.profileImage) : '');
    setFormError('');
    setModalOpen(true);
  };

  const generatePassword = async () => {
    try {
      const res = await userAdminService.generatePassword();
      const pwd = res.data.data.temporaryPassword;
      setForm((f) => ({ ...f, password: pwd, confirmPassword: pwd }));
      setShowPassword(true);
      toast.success('Random password generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate password');
    }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.username.trim() || !form.email.trim() || !form.roleId) {
      const message = 'Name, username, email and role are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!editing && (!form.password || form.password !== form.confirmPassword)) {
      const message = 'Password and confirm password must match';
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        roleId: form.roleId,
        isActive: form.isActive,
      };
      if (!editing) {
        payload.password = form.password;
        payload.confirmPassword = form.confirmPassword;
        await userAdminService.create(payload, file);
        toast.success('User created');
      } else {
        await userAdminService.update(editing.id, payload, file);
        toast.success('User updated');
      }
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

  const confirmDelete = async () => {
    const deleteId = confirm.id;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await userAdminService.remove(deleteId);
      setItems((prev) => prev.filter((u) => u.id !== deleteId));
      toast.success('User deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
      fetchList(pagination.page);
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setResetModal((m) => ({ ...m, loading: true }));
    try {
      await userAdminService.resetPassword(resetModal.user.id, {
        password: resetModal.password,
        confirmPassword: resetModal.confirmPassword,
      });
      toast.success('Password reset');
      setResetModal({ open: false, user: null, password: '', confirmPassword: '', loading: false });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
      setResetModal((m) => ({ ...m, loading: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <SearchBar value={search} onChange={setSearch} placeholder="Search name, email, username, mobile..." />
          </div>
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="">All roles</option>
            {roleOptions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="rounded-xl px-4 py-2.5 text-sm">
            <FaPlus /> Create User
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Login</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted">
                    Loading users...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-muted">
                    No users found
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="border-t border-slate-50 hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <img
                        src={mediaUrl(u.profileImage) || '/favicon.png'}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{u.name}</td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3 text-muted">{u.mobile || 0}</td>
                    <td className="px-4 py-3 text-muted">{u.username || 0}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                        {u.roleName || u.roleSlug || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-xs text-muted">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button type="button" title="View" onClick={() => setViewUser(u)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                          <FaEye size={13} />
                        </button>
                        {canEdit && (
                          <button type="button" title="Edit" onClick={() => openEdit(u)} className="rounded-lg p-2 text-brand hover:bg-brand/10">
                            <FaEdit size={13} />
                          </button>
                        )}
                        {canEdit && (
                          <button type="button" title="Reset Password" onClick={() => setResetModal({ open: true, user: u, password: '', confirmPassword: '', loading: false })} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">
                            <FaKey size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" title="Are you sure you want to delete this?" onClick={() => setConfirm({ open: true, id: u.id, loading: false })} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
                            <FaTrash size={13} />
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
        {!loading && items.length > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => fetchList(page)}
              onLimitChange={(limit) => {
                setPagination((prev) => ({ ...prev, limit, page: 1 }));
                setTimeout(() => fetchList(1), 0);
              }}
            />
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={saveUser} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-xl font-bold text-ink">{editing ? 'Edit User' : 'Create Account'}</h3>
            <p className="mt-1 text-sm text-muted">Manage staff access for Kuldeep Malik Sports Academy admin.</p>
            <FormErrorBanner message={formError} />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                Full Name *
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="text-sm">
                Username *
                <input required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="text-sm">
                Email *
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
              </label>
              <label className="text-sm">
                Mobile Number
                <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="10-digit mobile" />
              </label>
              {!editing && (
                <>
                  <label className="text-sm">
                    Password *
                    <div className="relative mt-1">
                      <input
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10"
                      />
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShowPassword((s) => !s)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </label>
                  <label className="text-sm">
                    Confirm Password *
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <Button type="button" variant="secondary" onClick={generatePassword} className="rounded-xl text-sm">
                      <FaRandom /> Generate Random Password
                    </Button>
                  </div>
                </>
              )}
              <label className="text-sm">
                Role *
                <select required value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5">
                  <option value="">Select role</option>
                  {roleOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Status
                <select
                  value={form.isActive ? 'Active' : 'Inactive'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'Active' })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5"
                >
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.sendWelcomeEmail}
                  onChange={(e) => setForm({ ...form, sendWelcomeEmail: e.target.checked })}
                />
                Send Welcome Email
              </label>
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted">Profile Photo</label>
                <div className="mt-2 flex items-center gap-4">
                  <img src={preview || '/favicon.png'} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-slate-100" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setFile(f || null);
                      setPreview(f ? URL.createObjectURL(f) : '');
                    }}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {viewUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setViewUser(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4">
              <img src={mediaUrl(viewUser.profileImage) || '/favicon.png'} alt="" className="h-16 w-16 rounded-full object-cover" />
              <div>
                <h3 className="font-display text-xl font-bold">{viewUser.name}</h3>
                <p className="text-sm text-muted">{viewUser.roleName}</p>
              </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted">Email</dt><dd className="font-medium">{viewUser.email}</dd></div>
              <div><dt className="text-muted">Username</dt><dd className="font-medium">{viewUser.username || 0}</dd></div>
              <div><dt className="text-muted">Mobile</dt><dd className="font-medium">{viewUser.mobile || 0}</dd></div>
              <div><dt className="text-muted">Status</dt><dd className="font-medium">{viewUser.isActive ? 'Active' : 'Inactive'}</dd></div>
              <div><dt className="text-muted">Last Login</dt><dd className="font-medium">{formatDate(viewUser.lastLoginAt)}</dd></div>
              <div><dt className="text-muted">Created</dt><dd className="font-medium">{formatDate(viewUser.createdAt)}</dd></div>
            </dl>
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" onClick={() => setViewUser(null)} className="rounded-xl">Close</Button>
            </div>
          </div>
        </div>
      )}

      {resetModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={submitReset} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold">Reset Password</h3>
            <p className="mt-1 text-sm text-muted">{resetModal.user?.email}</p>
            <label className="mt-4 block text-sm">
              New Password
              <input required type="password" value={resetModal.password} onChange={(e) => setResetModal({ ...resetModal, password: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <label className="mt-3 block text-sm">
              Confirm Password
              <input required type="password" value={resetModal.confirmPassword} onChange={(e) => setResetModal({ ...resetModal, confirmPassword: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setResetModal({ open: false, user: null, password: '', confirmPassword: '', loading: false })} className="rounded-xl">Cancel</Button>
              <Button type="submit" disabled={resetModal.loading} className="rounded-xl">{resetModal.loading ? 'Saving...' : 'Reset'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message="This permanently removes the account."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
