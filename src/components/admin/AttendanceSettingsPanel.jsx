import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaMapMarkerAlt, FaSave, FaCrosshairs, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';
import Button from '../ui/Button';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { attendanceSettingsService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import { getCurrentGpsPosition } from '../../utils/geolocation';
import { clearPublicCache } from '../../utils/publicCache';

const RADIUS_PRESETS = [100, 250, 500, 750, 1000];

export default function AttendanceSettingsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = can('attendance.view') || canModule('attendance');
  const canEdit = can('attendance.edit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: 'Kuldeep Malik Sports Academy',
    latitude: '',
    longitude: '',
    allowedRadiusMeters: 500,
    maxGpsAccuracyMeters: 100,
    isEnabled: true,
  });
  const [pendingCapture, setPendingCapture] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await attendanceSettingsService.get();
      const s = res.data?.data?.settings || {};
      setForm({
        name: s.name || 'Kuldeep Malik Sports Academy',
        latitude: s.latitude != null ? String(s.latitude) : '',
        longitude: s.longitude != null ? String(s.longitude) : '',
        allowedRadiusMeters: s.allowedRadiusMeters ?? 500,
        maxGpsAccuracyMeters: s.maxGpsAccuracyMeters ?? 100,
        isEnabled: s.isEnabled !== false,
      });
      setError('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load attendance settings'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  const mapUrl = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const delta = Math.max(0.002, (Number(form.allowedRadiusMeters) || 500) / 111000);
    const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
  }, [form.latitude, form.longitude, form.allowedRadiusMeters]);

  const openMapExternal = () => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      toast.error('Enter or capture latitude/longitude first');
      return;
    }
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim() || 'Kuldeep Malik Sports Academy',
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        allowedRadiusMeters: Number(form.allowedRadiusMeters) || 500,
        maxGpsAccuracyMeters: Number(form.maxGpsAccuracyMeters) || 100,
        isEnabled: Boolean(form.isEnabled),
      };
      const res = await attendanceSettingsService.update(payload);
      clearPublicCache('akhada-location');
      toast.success(res.data?.message || 'Settings saved');
      setPendingCapture(null);
      await load();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUseCurrent = async () => {
    if (!canEdit) return;
    try {
      const pos = await getCurrentGpsPosition({ maximumAge: 0 });
      setPendingCapture(pos);
      setForm((f) => ({
        ...f,
        latitude: String(pos.latitude),
        longitude: String(pos.longitude),
      }));
      toast.success(
        `Current location captured\nAccuracy: ${Math.round(pos.accuracy || 0)} m\nConfirm with Save Location.`
      );
    } catch (err) {
      toast.error(err.message || 'Unable to get current location');
    }
  };

  const handleTest = async () => {
    try {
      const pos = await getCurrentGpsPosition({ maximumAge: 5000 });
      const res = await attendanceSettingsService.test({
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      });
      const data = res.data?.data;
      setTestResult(data);
      if (data?.ok) toast.success(data.message || 'LOCATION VERIFIED');
      else toast.error(data?.message || 'LOCATION NOT VERIFIED');
    } catch (err) {
      toast.error(getApiErrorMessage(err, err.message || 'Test failed'));
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div className="space-y-5">
      <FormErrorBanner message={error} />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        <p className="font-semibold">Important</p>
        <p className="mt-1 text-xs leading-relaxed">
          Do not guess coordinates. Stand at Kuldeep Malik Sports Academy and tap <strong>Use Current Location</strong>, or paste
          verified Google Maps coordinates. QR attendance stays blocked until latitude/longitude are saved.
        </p>
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <FaMapMarkerAlt className="text-brand" />
          <div>
            <h3 className="text-sm font-bold text-ink">Academy Location</h3>
            <p className="text-xs text-muted">Geofence for QR attendance (default radius 500 m)</p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              Academy Name
              <input
                value={form.name}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Latitude
              <input
                value={form.latitude}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="e.g. from Google Maps"
              />
            </label>
            <label className="block text-sm">
              Longitude
              <input
                value={form.longitude}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                placeholder="e.g. from Google Maps"
              />
            </label>
            <label className="block text-sm">
              Allowed Radius (meters)
              <select
                value={RADIUS_PRESETS.includes(Number(form.allowedRadiusMeters)) ? form.allowedRadiusMeters : 'custom'}
                disabled={!canEdit}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  setForm((f) => ({ ...f, allowedRadiusMeters: Number(e.target.value) }));
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                {RADIUS_PRESETS.map((r) => (
                  <option key={r} value={r}>
                    {r} m
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <input
                type="number"
                min={50}
                max={5000}
                value={form.allowedRadiusMeters}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, allowedRadiusMeters: Number(e.target.value) || 500 }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Max GPS Accuracy (meters)
              <input
                type="number"
                min={10}
                max={1000}
                value={form.maxGpsAccuracyMeters}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, maxGpsAccuracyMeters: Number(e.target.value) || 100 }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="mt-1 block text-xs text-muted">Reject scans when GPS accuracy is worse than this (default 100 m).</span>
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isEnabled}
                disabled={!canEdit}
                onChange={(e) => setForm((f) => ({ ...f, isEnabled: e.target.checked }))}
              />
              Enforce geofence on QR attendance
            </label>
          </div>
        )}

        {pendingCapture ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Captured GPS — Accuracy: {Math.round(pendingCapture.accuracy || 0)} m. Click Save Location to confirm.
          </div>
        ) : null}

        {canEdit ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving} className="rounded-lg">
              <FaSave className="mr-2" />
              {saving ? 'Saving…' : 'Save Location'}
            </Button>
            <Button variant="secondary" onClick={handleUseCurrent} className="rounded-lg">
              <FaCrosshairs className="mr-2" />
              Use Current Location
            </Button>
            <Button variant="secondary" onClick={openMapExternal} className="rounded-lg">
              <FaExternalLinkAlt className="mr-2" />
              Open Map
            </Button>
            <Button variant="secondary" onClick={handleTest} className="rounded-lg">
              <FaCheck className="mr-2" />
              Test Location
            </Button>
          </div>
        ) : null}

        {testResult ? (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              testResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {testResult.message}
            {testResult.distanceMeters != null ? (
              <p className="mt-1 text-xs">Distance: {Math.round(testResult.distanceMeters)} m</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h4 className="text-sm font-bold text-ink">Map Preview</h4>
          <p className="text-xs text-muted">
            Marker = Academy center · Allowed radius = {form.allowedRadiusMeters || 500} m (configure above)
          </p>
        </div>
        {mapUrl ? (
          <iframe title="Academy geofence map" src={mapUrl} className="h-72 w-full border-0" loading="lazy" />
        ) : (
          <div className="flex h-48 items-center justify-center bg-surface text-sm text-muted">
            Save latitude/longitude to preview the map.
          </div>
        )}
      </div>
    </div>
  );
}
