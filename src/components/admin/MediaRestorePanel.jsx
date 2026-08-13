import { useCallback, useEffect, useState } from 'react';
import { FaDatabase, FaSync } from 'react-icons/fa';
import Button from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { mediaRestoreService } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import AccessDenied from './AccessDenied';
import { useAuth } from '../../context/AuthContext';

export default function MediaRestorePanel() {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await mediaRestoreService.status();
      setStatus(res.data?.data || res.data || null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load media status'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isSuperAdmin) loadStatus();
  }, [isSuperAdmin, loadStatus]);

  if (!isSuperAdmin) return <AccessDenied />;

  const runRestore = async (mode) => {
    setRestoring(true);
    setLastResult(null);
    try {
      const res = await mediaRestoreService.restore(mode);
      const data = res.data?.data || res.data;
      setLastResult(data);
      toast.success(res.data?.message || 'Media restore finished');
      await loadStatus();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Media restore failed'));
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-[#E9E7DE] bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
            <FaDatabase />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink">Restore Missing Media</h3>
            <p className="mt-1 text-sm text-muted">
              After a Render disk wipe, recreate missing <code className="text-xs">/uploads</code> files from
              PostgreSQL backup. Normal image requests still use disk (fast) — Postgres is backup only.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Referenced files', value: status?.referencedCount },
            { label: 'Postgres backups', value: status?.blobCount },
            { label: 'On disk', value: status?.availableOnDisk },
            { label: 'Missing on disk', value: status?.missingOnDisk },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-[#E9E7DE] bg-[#F8F7F2] px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{item.label}</p>
              <p className="mt-1 text-xl font-bold text-ink">{loading ? '…' : item.value ?? 0}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" onClick={() => runRestore('referenced')} disabled={restoring || loading}>
            <FaSync className={`mr-2 ${restoring ? 'animate-spin' : ''}`} />
            Restore referenced missing
          </Button>
          <Button type="button" variant="secondary" onClick={() => runRestore('all')} disabled={restoring || loading}>
            Restore all missing backups
          </Button>
          <Button type="button" variant="ghost" onClick={loadStatus} disabled={loading || restoring}>
            Refresh status
          </Button>
        </div>
      </div>

      {lastResult ? (
        <div className="rounded-[14px] border border-[#E9E7DE] bg-white p-5 shadow-sm">
          <h4 className="text-sm font-bold text-ink">Last restore result</h4>
          <ul className="mt-3 grid gap-2 text-sm text-ink sm:grid-cols-2">
            <li>Total checked: {lastResult.totalChecked ?? 0}</li>
            <li>Already available: {lastResult.alreadyAvailable ?? 0}</li>
            <li>Restored: {lastResult.restored ?? 0}</li>
            <li>Failed: {lastResult.failed ?? 0}</li>
            <li className="sm:col-span-2 text-muted">Mode: {lastResult.mode}</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
