import { useCallback, useEffect, useState } from 'react';
import { FaFingerprint, FaPlus, FaSync, FaPlug, FaTrash, FaEdit } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import StatCard from './StatCard';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { biometricService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';

const emptyForm = {
  name: '',
  deviceType: 'fingerprint',
  ipAddress: '',
  port: '4370',
  location: '',
  serialNumber: '',
  adapterKey: 'generic_http',
  isEnabled: true,
};

function statusDot(status) {
  const s = String(status || 'offline').toLowerCase();
  if (s === 'online') return 'bg-emerald-500';
  if (s === 'syncing') return 'bg-amber-400';
  if (s === 'error') return 'bg-red-500';
  if (s === 'disabled') return 'bg-slate-400';
  return 'bg-slate-300';
}

function formatTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

export default function BiometricDevicesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = can('attendance.view') || canModule('attendance');
  const canCreate = can('attendance.create');
  const canEdit = can('attendance.edit');

  const [devices, setDevices] = useState([]);
  const [unknownLogs, setUnknownLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [logsDevice, setLogsDevice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, unkRes] = await Promise.all([
        biometricService.listDevices(),
        biometricService.unknownLogs({ limit: 30 }),
      ]);
      setDevices(devRes.data?.data?.devices || []);
      setUnknownLogs(unkRes.data?.data?.logs || []);
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load biometric devices'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setCreatedSecret(null);
    setModalOpen(true);
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setForm({
      name: d.name || '',
      deviceType: d.deviceType || 'fingerprint',
      ipAddress: d.ipAddress || '',
      port: String(d.port || 4370),
      location: d.location || '',
      serialNumber: d.serialNumber || '',
      adapterKey: d.adapterKey || 'generic_http',
      isEnabled: d.isEnabled !== false,
    });
    setCreatedSecret(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Device name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        deviceType: form.deviceType,
        ipAddress: form.ipAddress.trim() || null,
        port: Number(form.port) || 4370,
        location: form.location.trim() || null,
        serialNumber: form.serialNumber.trim() || null,
        adapterKey: form.adapterKey,
        isEnabled: Boolean(form.isEnabled),
      };
      if (editingId) {
        const res = await biometricService.updateDevice(editingId, payload);
        toast.success(res.data?.message || 'Device updated');
        if (res.data?.data?.apiSecret) setCreatedSecret(res.data.data.apiSecret);
        else setModalOpen(false);
      } else {
        const res = await biometricService.createDevice(payload);
        toast.success(res.data?.message || 'Device created');
        setCreatedSecret(res.data?.data?.apiSecret || null);
      }
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await biometricService.deleteDevice(confirm.id);
      toast.success('Device deleted');
      setConfirm({ open: false, id: null, loading: false });
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
    }
  };

  const handleTest = async (id) => {
    try {
      const res = await biometricService.testDevice(id);
      toast.success(res.data?.data?.message || 'Connection test OK');
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Test failed'));
    }
  };

  const handleSync = async (id) => {
    try {
      const res = await biometricService.syncDevice(id);
      toast.success(res.data?.message || 'Sync recorded');
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Sync failed'));
    }
  };

  const openLogs = async (d) => {
    setLogsDevice(d);
    try {
      const res = await biometricService.deviceLogs(d.id, { limit: 50 });
      setLogs(res.data?.data?.logs || []);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load logs'));
      setLogs([]);
    }
  };

  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline' || d.status === 'disabled').length;

  return (
    <div className="space-y-5">
      <FormErrorBanner message={error} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Devices" value={devices.length} icon={FaFingerprint} loading={loading} />
        <StatCard label="Online" value={online} icon={FaPlug} loading={loading} />
        <StatCard label="Offline / Disabled" value={offline} icon={FaSync} loading={loading} />
        <StatCard label="Unknown Users" value={unknownLogs.length} icon={FaFingerprint} loading={loading} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink">Biometric Devices</h3>
          <p className="text-xs text-muted">
            Devices push punches via sync agent to /api/biometric/ingest (no browser fingerprint access).
          </p>
        </div>
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg">
            <FaPlus className="mr-2" />
            Add Device
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">IP / Port</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Sync</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted">
                  No biometric devices yet.
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{d.name}</p>
                    <p className="text-xs text-muted">{d.serialNumber || d.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{d.deviceType || 'fingerprint'}</td>
                  <td className="px-4 py-3">
                    {d.ipAddress || '—'}
                    {d.port ? `:${d.port}` : ''}
                  </td>
                  <td className="px-4 py-3">{d.location || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2 capitalize">
                      <span className={`h-2 w-2 rounded-full ${statusDot(d.status)}`} />
                      {d.isEnabled === false ? 'disabled' : d.status || 'offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatTime(d.lastSyncAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {canEdit ? (
                        <>
                          <Button variant="secondary" className="rounded-lg px-2 py-1 text-xs" onClick={() => handleTest(d.id)}>
                            Test
                          </Button>
                          <Button variant="secondary" className="rounded-lg px-2 py-1 text-xs" onClick={() => handleSync(d.id)}>
                            Sync Now
                          </Button>
                          <Button variant="secondary" className="rounded-lg px-2 py-1 text-xs" onClick={() => openEdit(d)}>
                            <FaEdit />
                          </Button>
                          <Button variant="secondary" className="rounded-lg px-2 py-1 text-xs" onClick={() => openLogs(d)}>
                            Logs
                          </Button>
                          <Button
                            variant="secondary"
                            className="rounded-lg px-2 py-1 text-xs text-red-600"
                            onClick={() => setConfirm({ open: true, id: d.id, loading: false })}
                          >
                            <FaTrash />
                          </Button>
                        </>
                      ) : (
                        <Button variant="secondary" className="rounded-lg px-2 py-1 text-xs" onClick={() => openLogs(d)}>
                          Logs
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h4 className="text-sm font-bold text-ink">Unknown Biometric Users</h4>
          <p className="text-xs text-muted">Punches with no student/coach biometric mapping — no attendance created.</p>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Biometric ID</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {unknownLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  No unknown biometric events.
                </td>
              </tr>
            ) : (
              unknownLogs.map((log) => (
                <tr key={log.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{log.biometricUserId}</td>
                  <td className="px-4 py-3">{log.device?.name || '—'}</td>
                  <td className="px-4 py-3">{formatTime(log.eventAt)}</td>
                  <td className="px-4 py-3 text-muted">{log.message || 'Unknown Biometric User'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={handleSave} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-ink">{editingId ? 'Edit Device' : 'Add Device'}</h3>
            {createdSecret ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Save this API secret now — it will not be shown again.</p>
                <code className="mt-2 block break-all rounded bg-white px-2 py-1 text-xs">{createdSecret}</code>
                <p className="mt-2 text-xs">
                  Sync agent headers: X-Device-Id = device id, X-Device-Secret = this secret → POST /api/biometric/ingest
                </p>
                <Button type="button" className="mt-3 rounded-lg" onClick={() => setModalOpen(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  Device Name *
                  <input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Device Type
                  <select
                    value={form.deviceType}
                    onChange={(e) => setForm((f) => ({ ...f, deviceType: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="fingerprint">Fingerprint</option>
                    <option value="face">Face</option>
                    <option value="card">Card</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm">
                    IP Address
                    <input
                      value={form.ipAddress}
                      onChange={(e) => setForm((f) => ({ ...f, ipAddress: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                      placeholder="192.168.1.201"
                    />
                  </label>
                  <label className="block text-sm">
                    Port
                    <input
                      value={form.port}
                      onChange={(e) => setForm((f) => ({ ...f, port: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  Location
                  <input
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                    placeholder="Main Gate"
                  />
                </label>
                <label className="block text-sm">
                  Serial Number
                  <input
                    value={form.serialNumber}
                    onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm">
                  Adapter
                  <select
                    value={form.adapterKey}
                    onChange={(e) => setForm((f) => ({ ...f, adapterKey: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  >
                    <option value="generic_http">Generic HTTP (sync agent)</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isEnabled}
                    onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
                  />
                  Enabled
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      ) : null}

      {logsDevice ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <h3 className="text-sm font-bold text-ink">{logsDevice.name} — Device Logs</h3>
                <p className="text-xs text-muted">Recent biometric events from this device</p>
              </div>
              <button type="button" className="text-sm text-muted" onClick={() => setLogsDevice(null)}>
                Close
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2">Bio ID</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted">
                        No logs yet.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-t border-slate-100">
                        <td className="px-4 py-2 font-medium">{log.biometricUserId}</td>
                        <td className="px-4 py-2 capitalize">{log.status}</td>
                        <td className="px-4 py-2">{formatTime(log.eventAt)}</td>
                        <td className="px-4 py-2 text-muted">{log.message || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        loading={confirm.loading}
        title="Delete biometric device?"
        message="Device logs will also be removed. Attendance records are kept."
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
