import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { FaCamera, FaSignOutAlt, FaUser } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { attendanceService, authService } from '../services';
import { mediaUrl } from '../utils/mediaUrl';
import { getApiErrorMessage } from '../utils/apiError';
import { getCurrentGpsPosition, formatAttendanceScanSuccess } from '../utils/geolocation';
import { parseAttendanceQrText } from '../utils/attendanceQr';

const SCANNER_ID = 'student-attendance-qr-reader';

function cameraErrorMessage(err) {
  const name = err?.name || '';
  const msg = String(err?.message || err || '');
  if (name === 'NotAllowedError' || /permission|notallowed|denied/i.test(msg)) {
    return 'Camera permission is blocked. Click the camera/lock icon in the address bar → Allow Camera → then tap Retry Camera.';
  }
  if (name === 'NotFoundError' || /not found|no device/i.test(msg)) {
    return 'No camera found on this device.';
  }
  if (name === 'NotReadableError' || /in use|track start|readable/i.test(msg)) {
    return 'Camera is already in use by another app/tab. Close other apps using camera and retry.';
  }
  if (/secure|https|insecure|ssl/i.test(msg)) {
    return 'Camera needs a secure page (HTTPS). Open the site with https:// and accept the certificate warning.';
  }
  return msg || 'Camera permission is required to scan the attendance QR.';
}

async function pickCameraId() {
  const cameras = await Html5Qrcode.getCameras();
  if (!cameras?.length) {
    throw new Error('No camera found on this device.');
  }
  const back = cameras.find((c) => /back|rear|environment|world/i.test(c.label));
  return (back || cameras[0]).id;
}

export default function StudentDashboard() {
  const { user, loading, logout, isStudent } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [section, setSection] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [dataLoading, setDataLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraError, setCameraError] = useState('');
  const [wantScanner, setWantScanner] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const scannerRef = useRef(null);
  const handlingRef = useRef(false);

  const loadData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [p, a] = await Promise.all([attendanceService.myProfile(), attendanceService.myAttendance()]);
      setProfile(p.data?.data?.student || null);
      setAttendance({
        summary: a.data?.data?.summary || null,
        records: a.data?.data?.records || [],
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load student data'));
    } finally {
      setDataLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user && isStudent) loadData();
  }, [user, isStudent, loadData]);

  const stopScanner = useCallback(async () => {
    setWantScanner(false);
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        const state = scanner.getState?.();
        // 2 = SCANNING in html5-qrcode
        if (state === 2 || scanner.isScanning) {
          await scanner.stop();
        }
        await scanner.clear();
      } catch {
        /* ignore */
      }
    }
    setScanning(false);
  }, []);

  useEffect(
    () => () => {
      stopScanner();
    },
    [stopScanner]
  );

  const handleScanSuccess = useCallback(
    async (decodedText) => {
      if (handlingRef.current) return;
      handlingRef.current = true;
      setScanBusy(true);
      try {
        const payload = parseAttendanceQrText(decodedText);
        if (!payload?.sessionId || !payload?.token) {
          throw new Error('Invalid Attendance QR.\nPlease scan the current QR displayed by the admin.');
        }

        let gps;
        try {
          gps = await getCurrentGpsPosition();
        } catch (locErr) {
          throw new Error(locErr.message || 'Location permission is required for attendance.');
        }

        const res = await attendanceService.scan({
          payload,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          timestamp: new Date(gps.timestamp).toISOString(),
        });
        const attendance = res.data?.data?.attendance || null;
        setScanResult(attendance);
        toast.success(formatAttendanceScanSuccess(attendance) || res.data?.message || 'Attendance marked successfully');
        await stopScanner();
        await loadData();
        setSection('attendance');
      } catch (err) {
        const code = err.response?.data?.code;
        const msg = err.response?.data?.message || err.message || 'Scan failed';
        toast.error(msg);
        if (code === 'ATTENDANCE_ALREADY_MARKED' || code === 'LOCATION_OUTSIDE_RADIUS') {
          await stopScanner();
        }
      } finally {
        setScanBusy(false);
        handlingRef.current = false;
      }
    },
    [loadData, stopScanner, toast]
  );

  const startScannerEngine = useCallback(async () => {
    setCameraError('');
    setScanResult(null);

    // Wait until scanner container exists in DOM
    let el = document.getElementById(SCANNER_ID);
    for (let i = 0; i < 20 && !el; i += 1) {
      await new Promise((r) => setTimeout(r, 50));
      el = document.getElementById(SCANNER_ID);
    }
    if (!el) {
      setCameraError('Scanner view failed to load. Please retry.');
      setScanning(false);
      return;
    }

    // Stop previous instance if any
    if (scannerRef.current) {
      try {
        const prev = scannerRef.current;
        scannerRef.current = null;
        const state = prev.getState?.();
        if (state === 2 || prev.isScanning) await prev.stop();
        await prev.clear();
      } catch {
        /* ignore */
      }
    }

    try {
      if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        throw new Error('Camera needs HTTPS. Open https://' + location.host + ' and accept the certificate warning.');
      }

      const cameraId = await pickCameraId();
      const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: (viewW, viewH) => {
          const side = Math.min(250, Math.floor(Math.min(viewW, viewH) * 0.75));
          return { width: side, height: side };
        },
        aspectRatio: 1.0,
        disableFlip: false,
      };

      await scanner.start(cameraId, config, (text) => handleScanSuccess(text), () => {});
      setScanning(true);
      setCameraError('');
    } catch (err) {
      const message = cameraErrorMessage(err);
      setCameraError(message);
      setScanning(false);
      toast.error(message);
      try {
        await scannerRef.current?.clear?.();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
  }, [handleScanSuccess, toast]);

  // Start camera after Scan section mounts
  useEffect(() => {
    if (section !== 'scan' || !wantScanner) return undefined;
    let cancelled = false;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => r()));
      if (!cancelled) await startScannerEngine();
    })();
    return () => {
      cancelled = true;
    };
  }, [section, wantScanner, startScannerEngine]);

  const openScanner = async () => {
    try {
      await getCurrentGpsPosition();
    } catch (err) {
      toast.error(err.message || 'Location permission is required for attendance.');
      return;
    }
    setSection('scan');
    setWantScanner(true);
  };

  if (loading) return <PageLoader message="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStudent) {
    if (user.isCoach || user.accountType === 'coach' || user.coachId) return <Navigate to="/coach" replace />;
    if (user.canAccessAdmin || user.isSuperAdmin) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  const student = profile || user.student || {};
  const summary = attendance.summary || {};

  return (
    <div className="min-h-[100dvh] bg-surface">
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Logo />
            <p className="mt-0.5 text-xs font-medium text-muted">Student Dashboard</p>
          </div>
          <Button
            variant="secondary"
            className="rounded-lg px-3 py-2 text-sm"
            onClick={async () => {
              await stopScanner();
              await logout();
              navigate('/login');
            }}
          >
            <FaSignOutAlt className="mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-xl border border-slate-100 bg-white p-3">
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <img
              src={mediaUrl(student.photo || user.profileImage)}
              alt={student.fullName || user.name}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink">{student.fullName || user.name}</p>
              <p className="truncate text-xs text-muted">{student.registrationNumber || user.username}</p>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand">Role: Student</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'scan', label: 'Scan Attendance' },
              { id: 'attendance', label: 'My Attendance' },
              { id: 'profile', label: 'My Profile' },
              { id: 'password', label: 'Change Password' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={async () => {
                  if (item.id === 'scan') {
                    openScanner();
                    return;
                  }
                  await stopScanner();
                  setSection(item.id);
                }}
                className={`rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                  section === item.id ? 'bg-brand/10 text-brand' : 'text-ink hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <Link to="/" className="mt-4 block px-3 text-sm text-brand hover:underline">
            ← Website
          </Link>
        </aside>

        <main className="min-w-0">
          {dataLoading ? <p className="text-sm text-muted">Loading your data…</p> : null}

          {section === 'dashboard' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-[#FFF8F0] to-white p-5">
                <h1 className="text-xl font-bold text-ink sm:text-2xl">Welcome, {student.fullName || user.name}</h1>
                <p className="mt-1 text-sm text-muted">
                  Registration: <span className="font-semibold text-ink">{student.registrationNumber}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={openScanner}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-brand/30 bg-brand px-6 py-10 text-white shadow-lg transition hover:bg-brand/90"
              >
                <FaCamera className="text-4xl" />
                <span className="text-lg font-bold">Scan Attendance QR</span>
                <span className="text-sm text-white/80">Open camera and scan the admin QR</span>
              </button>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Total Days</p>
                  <p className="mt-1 text-xl font-bold text-ink">{summary.totalDays ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Present</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{summary.present ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Absent</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{summary.absent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Attendance %</p>
                  <p className="mt-1 text-xl font-bold text-ink">{summary.attendanceRate ?? 0}%</p>
                </div>
              </div>
            </div>
          ) : null}

          {section === 'scan' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">Scan Attendance QR</h2>
              {cameraError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-line">
                  {cameraError}
                </div>
              ) : null}
              {scanBusy ? <p className="text-sm font-medium text-brand">Validating QR…</p> : null}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                <div id={SCANNER_ID} className="min-h-[280px] w-full" />
              </div>
              <p className="text-center text-sm text-muted">Align the QR inside the scan box</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={async () => {
                    await stopScanner();
                    setWantScanner(true);
                    setSection('scan');
                  }}
                  className="rounded-lg"
                >
                  <FaCamera className="mr-2" /> Retry Camera
                </Button>
                {scanning ? (
                  <Button variant="secondary" onClick={stopScanner} className="rounded-lg">
                    Stop Camera
                  </Button>
                ) : null}
              </div>
              {scanResult ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-bold">✓ Attendance Marked Successfully</p>
                  <p className="mt-2">Student: {scanResult.studentName || scanResult.name}</p>
                  <p>Registration ID: {scanResult.registrationId}</p>
                  <p>
                    Date: {scanResult.date} · Time: {scanResult.time}
                  </p>
                  {scanResult.distanceFromAkhada != null || scanResult.distanceMeters != null ? (
                    <p>
                      Distance from Akhada:{' '}
                      {Math.round(scanResult.distanceFromAkhada ?? scanResult.distanceMeters)} meters
                    </p>
                  ) : null}
                  {scanResult.locationVerified ? <p>Location Verified ✓</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {section === 'attendance' ? (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-ink">My Attendance</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Total Days</p>
                  <p className="mt-1 text-xl font-bold">{summary.totalDays ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Present</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700">{summary.present ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Absent</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{summary.absent ?? 0}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-4">
                  <p className="text-xs text-muted">Attendance %</p>
                  <p className="mt-1 text-xl font-bold">{summary.attendanceRate ?? 0}%</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-surface text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-muted">
                          No attendance marked yet.
                        </td>
                      </tr>
                    ) : (
                      attendance.records.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">{r.date}</td>
                          <td className="px-4 py-3">{r.time}</td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Present
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {section === 'profile' ? (
            <div className="rounded-xl border border-slate-100 bg-white p-5">
              <div className="flex items-center gap-4">
                <img src={mediaUrl(student.photo)} alt="" className="h-20 w-20 rounded-xl object-cover" />
                <div>
                  <h2 className="text-lg font-bold text-ink">{student.fullName}</h2>
                  <p className="text-sm text-muted">{student.registrationNumber}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    <FaUser /> Student
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ['Father Name', student.fatherName],
                  ['Mother Name', student.motherName],
                  ['Mobile', student.mobileNumber],
                  ['Email', student.email],
                  ['Batch', student.batch],
                  ['Membership', student.membershipType],
                  ['Training Level', student.trainingLevel],
                  ['Status', student.status],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-slate-100 p-3">
                    <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-medium text-ink">{value || 0}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {section === 'password' ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
                  toast.error('Please fill all password fields');
                  return;
                }
                if (pwdForm.newPassword !== pwdForm.confirmPassword) {
                  toast.error('New passwords do not match');
                  return;
                }
                setPwdSaving(true);
                try {
                  await authService.changePassword(pwdForm);
                  toast.success('Password changed successfully');
                  setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                } catch (err) {
                  toast.error(getApiErrorMessage(err, 'Failed to change password'));
                } finally {
                  setPwdSaving(false);
                }
              }}
              className="rounded-xl border border-slate-100 bg-white p-5"
            >
              <h2 className="text-lg font-bold text-ink">Change Password</h2>
              <p className="mt-1 text-sm text-muted">Current password is required to set a new one.</p>
              <div className="mt-4 max-w-md space-y-3">
                <label className="block text-sm font-medium">
                  Current Password
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm font-medium">
                  New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, newPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="8+ chars, upper, lower, number"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Confirm New Password
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </label>
                <Button type="submit" disabled={pwdSaving}>
                  {pwdSaving ? 'Saving…' : 'Change Password'}
                </Button>
              </div>
            </form>
          ) : null}
        </main>
      </div>
    </div>
  );
}
