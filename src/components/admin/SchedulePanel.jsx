import { useEffect, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { scheduleService } from '../../services';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';

const EMPTY_SESSION = {
  key: '',
  titleEn: '',
  titleHi: '',
  timeEn: '',
  timeHi: '',
  noteEn: '',
  noteHi: '',
  displayOrder: 0,
  isActive: true,
};

const EMPTY_DAY = {
  dayKey: '',
  labelEn: '',
  labelHi: '',
  morningEn: '',
  morningHi: '',
  eveningEn: '',
  eveningHi: '',
  isHoliday: false,
  displayOrder: 0,
  isActive: true,
};

export default function SchedulePanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('schedule');
  const canCreate = can('schedule.create');
  const canEdit = can('schedule.edit');
  const canDelete = can('schedule.delete');
  const [tab, setTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_SESSION);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [sRes, dRes] = await Promise.all([
        scheduleService.listSessions({ limit: 50 }),
        scheduleService.listDays({ limit: 50 }),
      ]);
      setSessions(sRes.data.data.sessions || []);
      setDays(dRes.data.data.days || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(tab === 'sessions' ? EMPTY_SESSION : EMPTY_DAY);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setEditing(item);
    if (tab === 'sessions') {
      setForm({
        key: item.key || '',
        titleEn: item.titleEn || '',
        titleHi: item.titleHi || '',
        timeEn: item.timeEn || '',
        timeHi: item.timeHi || '',
        noteEn: item.noteEn || '',
        noteHi: item.noteHi || '',
        displayOrder: item.displayOrder ?? 0,
        isActive: item.isActive,
      });
    } else {
      setForm({
        dayKey: item.dayKey || '',
        labelEn: item.labelEn || '',
        labelHi: item.labelHi || '',
        morningEn: item.morningEn || '',
        morningHi: item.morningHi || '',
        eveningEn: item.eveningEn || '',
        eveningHi: item.eveningHi || '',
        isHoliday: Boolean(item.isHoliday),
        displayOrder: item.displayOrder ?? 0,
        isActive: item.isActive,
      });
    }
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editing && !canEdit) {
      toast.error('You do not have permission to edit the schedule');
      return;
    }
    if (!editing && !canCreate) {
      toast.error('You do not have permission to create schedule items');
      return;
    }
    setSaving(true);
    try {
      if (tab === 'sessions') {
        if (!form.titleEn.trim() || !form.titleHi.trim() || !form.timeEn.trim() || !form.timeHi.trim()) {
          const message = 'Titles and times are required';
          setFormError(message);
          toast.error(message);
          setSaving(false);
          return;
        }
        if (!editing && !form.key.trim()) {
          const message = 'Session key is required (e.g. morning)';
          setFormError(message);
          toast.error(message);
          setSaving(false);
          return;
        }
        const payload = {
          titleEn: form.titleEn.trim(),
          titleHi: form.titleHi.trim(),
          timeEn: form.timeEn.trim(),
          timeHi: form.timeHi.trim(),
          noteEn: form.noteEn.trim() || null,
          noteHi: form.noteHi.trim() || null,
          displayOrder: Number(form.displayOrder) || 0,
          isActive: form.isActive,
        };
        if (editing) await scheduleService.updateSession(editing._id, payload);
        else await scheduleService.createSession({ ...payload, key: form.key.trim().toLowerCase() });
      } else {
        if (!form.labelEn.trim() || !form.labelHi.trim()) {
          const message = 'Day labels are required';
          setFormError(message);
          toast.error(message);
          setSaving(false);
          return;
        }
        if (!editing && !form.dayKey.trim()) {
          const message = 'Day key is required (e.g. monday)';
          setFormError(message);
          toast.error(message);
          setSaving(false);
          return;
        }
        const payload = {
          labelEn: form.labelEn.trim(),
          labelHi: form.labelHi.trim(),
          morningEn: form.morningEn.trim(),
          morningHi: form.morningHi.trim(),
          eveningEn: form.eveningEn.trim(),
          eveningHi: form.eveningHi.trim(),
          isHoliday: form.isHoliday,
          displayOrder: Number(form.displayOrder) || 0,
          isActive: form.isActive,
        };
        if (editing) await scheduleService.updateDay(editing._id, payload);
        else await scheduleService.createDay({ ...payload, dayKey: form.dayKey.trim().toLowerCase() });
      }
      toast.success(editing ? 'Updated' : 'Created');
      setModalOpen(false);
      fetchAll();
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
      toast.error('You do not have permission to edit the schedule');
      return;
    }
    try {
      if (tab === 'sessions') await scheduleService.updateSession(item._id, { isActive: !item.isActive });
      else await scheduleService.updateDay(item._id, { isActive: !item.isActive });
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete schedule items');
      return;
    }
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      if (tab === 'sessions') await scheduleService.removeSession(confirm.id);
      else await scheduleService.removeDay(confirm.id);
      toast.success('Deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchAll();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  const items = tab === 'sessions' ? sessions : days;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab('sessions')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'sessions' ? 'bg-brand/10 text-brand' : 'text-muted hover:text-ink'
            }`}
          >
            Sessions
          </button>
          <button
            type="button"
            onClick={() => setTab('days')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === 'days' ? 'bg-brand/10 text-brand' : 'text-muted hover:text-ink'
            }`}
          >
            Weekly Days
          </button>
        </div>
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> {tab === 'sessions' ? 'Add Session' : 'Add Day'}
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
          <p className="p-8 text-center text-sm text-muted">No items yet.</p>
        ) : tab === 'sessions' ? (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Title / Time</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((item) => (
                <tr key={item._id} className="border-t border-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-muted">{item.key}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.titleEn}</p>
                    <p className="text-xs text-muted">{item.timeEn}</p>
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
                      <button type="button" onClick={() => openEdit(item)} className="mr-2 rounded-lg p-2 text-brand hover:bg-brand/10" aria-label="Edit">
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
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Day</th>
                <th className="px-4 py-3">Morning</th>
                <th className="px-4 py-3">Evening</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {days.map((item) => (
                <tr key={item._id} className="border-t border-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.labelEn}</p>
                    <p className="text-xs text-muted">
                      {item.dayKey}
                      {item.isHoliday ? ' · Holiday' : ''}
                    </p>
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted">{item.morningEn}</td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted">{item.eveningEn}</td>
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
                      <button type="button" onClick={() => openEdit(item)} className="mr-2 rounded-lg p-2 text-brand hover:bg-brand/10" aria-label="Edit">
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

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">
              {editing ? 'Edit' : 'Add'} {tab === 'sessions' ? 'Session' : 'Day'}
            </h3>
            <FormErrorBanner message={formError} />
            <div className="mt-4 space-y-4">
              {tab === 'sessions' ? (
                <>
                  {!editing && (
                    <label className="block text-sm font-medium text-ink">
                      Key (unique, e.g. morning)
                      <input
                        required
                        value={form.key}
                        onChange={(e) => setForm({ ...form, key: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                      />
                    </label>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink">
                      Title (EN)
                      <input required value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Title (HI)
                      <input required value={form.titleHi} onChange={(e) => setForm({ ...form, titleHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Time (EN)
                      <input required value={form.timeEn} onChange={(e) => setForm({ ...form, timeEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Time (HI)
                      <input required value={form.timeHi} onChange={(e) => setForm({ ...form, timeHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Note (EN)
                      <textarea rows={2} value={form.noteEn} onChange={(e) => setForm({ ...form, noteEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Note (HI)
                      <textarea rows={2} value={form.noteHi} onChange={(e) => setForm({ ...form, noteHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  {!editing && (
                    <label className="block text-sm font-medium text-ink">
                      Day key (e.g. monday)
                      <input
                        required
                        value={form.dayKey}
                        onChange={(e) => setForm({ ...form, dayKey: e.target.value })}
                        className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                      />
                    </label>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-medium text-ink">
                      Label (EN)
                      <input required value={form.labelEn} onChange={(e) => setForm({ ...form, labelEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Label (HI)
                      <input required value={form.labelHi} onChange={(e) => setForm({ ...form, labelHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Morning (EN)
                      <textarea rows={2} value={form.morningEn} onChange={(e) => setForm({ ...form, morningEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" placeholder="Comma-separated activities" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Morning (HI)
                      <textarea rows={2} value={form.morningHi} onChange={(e) => setForm({ ...form, morningHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Evening (EN)
                      <textarea rows={2} value={form.eveningEn} onChange={(e) => setForm({ ...form, eveningEn: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                    <label className="block text-sm font-medium text-ink">
                      Evening (HI)
                      <textarea rows={2} value={form.eveningHi} onChange={(e) => setForm({ ...form, eveningHi: e.target.value })} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
                    </label>
                  </div>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input type="checkbox" checked={form.isHoliday} onChange={(e) => setForm({ ...form, isHoliday: e.target.checked })} className="rounded border-slate-300" />
                    Holiday / recovery day
                  </label>
                </>
              )}
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
        title="Delete item?"
        message="This will remove it from the website schedule."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
