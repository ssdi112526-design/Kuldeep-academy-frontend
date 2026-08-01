import { useEffect, useMemo, useState } from 'react';
import { FaClone, FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { roleAdminService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { usePermissions } from '../../context/PermissionContext';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';

export default function RolesPanel() {
  const toast = useToast();
  const { can, isSuperAdmin } = usePermissions();
  const [roles, setRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const canView = can('roles.view') || isSuperAdmin;
  const canCreate = can('roles.create') || isSuperAdmin;
  const canEdit = can('roles.edit') || isSuperAdmin;
  const canDelete = can('roles.delete') || isSuperAdmin;

  const permissionsByMenu = useMemo(() => {
    const map = {};
    for (const p of allPermissions) {
      if (!map[p.menu]) map[p.menu] = [];
      map[p.menu].push(p);
    }
    return map;
  }, [allPermissions]);

  const fetchCatalog = async () => {
    const res = await roleAdminService.permissionsCatalog();
    setMenus(res.data.data.menus || []);
    setAllPermissions(res.data.data.permissions || []);
  };

  const fetchList = async (page = 1) => {
    setLoading(true);
    try {
      const res = await roleAdminService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      setRoles(res.data.data.roles || []);
      setPagination((p) => ({ ...p, ...res.data.data.pagination }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    fetchCatalog().catch(() => {});
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, debouncedSearch]);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', permissions: [] });
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setForm({
      name: role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])],
    });
    setModalOpen(true);
  };

  const togglePermission = (key) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key)
        ? f.permissions.filter((k) => k !== key)
        : [...f.permissions, key],
    }));
  };

  const toggleMenuAll = (menuKey, keys) => {
    const allOn = keys.every((k) => form.permissions.includes(k));
    setForm((f) => ({
      ...f,
      permissions: allOn
        ? f.permissions.filter((k) => !keys.includes(k))
        : Array.from(new Set([...f.permissions, ...keys])),
    }));
  };

  const saveRole = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await roleAdminService.update(editing.id, form);
        toast.success('Role updated');
      } else {
        await roleAdminService.create(form);
        toast.success('Role created');
      }
      setModalOpen(false);
      fetchList(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const clone = async (role) => {
    if (!canCreate) return;
    try {
      await roleAdminService.clone(role.id, { name: `${role.name} Copy` });
      toast.success('Role cloned');
      fetchList(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Clone failed');
    }
  };

  const confirmDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await roleAdminService.remove(confirm.id);
      toast.success('Role deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setConfirm((c) => ({ ...c, loading: false }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search roles..." />
        </div>
        {canCreate && (
          <Button onClick={openCreate} className="rounded-xl px-4 py-2.5 text-sm">
            <FaPlus /> Create Role
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    Loading roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted">
                    No roles found
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="border-t border-slate-50 hover:bg-slate-50/70">
                    <td className="px-4 py-3 font-semibold text-ink">{role.name}</td>
                    <td className="px-4 py-3 text-muted">{role.description || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          role.isSystem ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {role.isSystem ? 'System' : 'Custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3">{role.userCount}</td>
                    <td className="px-4 py-3">{role.permissionCount ?? role.permissions?.length ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {canEdit && (
                          <button type="button" title="Edit / Permissions" onClick={() => openEdit(role)} className="rounded-lg p-2 text-brand hover:bg-brand/10">
                            <FaEdit size={13} />
                          </button>
                        )}
                        {canCreate && (
                          <button type="button" title="Clone" onClick={() => clone(role)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                            <FaClone size={13} />
                          </button>
                        )}
                        {canDelete && !role.isSystem && (
                          <button type="button" title="Delete" onClick={() => setConfirm({ open: true, id: role.id, loading: false })} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
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
        {!loading && roles.length > 0 && (
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
          <form onSubmit={saveRole} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-display text-xl font-bold text-ink">{editing ? 'Edit Role & Permissions' : 'Create Role'}</h3>
              <p className="mt-1 text-sm text-muted">Assign menu-level permissions for this role.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm">
                  Role Name *
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
                <label className="text-sm">
                  Description
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5" />
                </label>
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted">Permission Matrix</h4>
                {(menus.length ? menus : Object.keys(permissionsByMenu).map((menu) => ({ menu, label: menu }))).map((menuDef) => {
                  const menuKey = menuDef.menu;
                  const perms = permissionsByMenu[menuKey] || [];
                  if (!perms.length) return null;
                  const keys = perms.map((p) => p.key);
                  const allOn = keys.every((k) => form.permissions.includes(k));
                  return (
                    <div key={menuKey} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h5 className="font-semibold text-ink">{menuDef.label || menuKey}</h5>
                        <label className="flex items-center gap-2 text-xs font-medium text-muted">
                          <input type="checkbox" checked={allOn} onChange={() => toggleMenuAll(menuKey, keys)} />
                          Select all
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {perms.map((p) => (
                          <label key={p.key} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs text-ink ring-1 ring-slate-100">
                            <input
                              type="checkbox"
                              checked={form.permissions.includes(p.key)}
                              onChange={() => togglePermission(p.key)}
                            />
                            {p.action.replace(/_/g, ' ')}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="rounded-xl">
                {saving ? 'Saving...' : editing ? 'Save Role' : 'Create Role'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete role?"
        message="Custom roles with no users can be deleted."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
