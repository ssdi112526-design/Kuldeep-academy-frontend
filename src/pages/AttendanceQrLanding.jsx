import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaExclamationTriangle, FaSignInAlt, FaUserSlash } from 'react-icons/fa';
import logoImg from '../assets/logo.png';
import Button from '../components/ui/Button';
import PageLoader from '../components/ui/PageLoader';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { attendanceService, coachPortalService } from '../services';
import { parseAttendanceQrText } from '../utils/attendanceQr';
import { getCurrentGpsPosition, formatAttendanceScanSuccess } from '../utils/geolocation';
import { getApiErrorMessage } from '../utils/apiError';

/**
 * Phone-camera QR landing — guests only see a popup + login icon (no homepage).
 */
export default function AttendanceQrLanding() {
  const { user, loading, isStudent, isCoach } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [guestBlocked, setGuestBlocked] = useState(false);
  const [errorPopup, setErrorPopup] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const startedRef = useRef(false);

  const payload = useMemo(() => {
    const data = searchParams.get('data') || searchParams.get('payload');
    if (data) {
      return parseAttendanceQrText(`/attendance/scan?data=${encodeURIComponent(data)}`);
    }
    const raw = searchParams.get('raw');
    if (raw) return parseAttendanceQrText(raw);
    return null;
  }, [searchParams]);

  const loginPath = useMemo(() => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    return `/login?redirect=${encodeURIComponent(returnTo)}`;
  }, []);

  useEffect(() => {
    if (loading || startedRef.current) return;

    if (!payload?.type || !payload?.sessionId || !payload?.token) {
      startedRef.current = true;
      setErrorPopup({
        title: 'Invalid QR',
        message: 'This attendance QR is invalid or incomplete. Please scan the current QR at Raghunandan Akhada.',
      });
      return;
    }

    if (!user) {
      startedRef.current = true;
      setGuestBlocked(true);
      return;
    }

    const isStudentQr = payload.type === 'akhada_attendance';
    const isCoachQr = payload.type === 'akhada_coach_attendance';

    if ((isStudentQr && !isStudent) || (isCoachQr && !isCoach) || (!isStudentQr && !isCoachQr)) {
      startedRef.current = true;
      setGuestBlocked(true);
      return;
    }

    startedRef.current = true;
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const gps = await getCurrentGpsPosition();
        const body = {
          payload,
          latitude: gps.latitude,
          longitude: gps.longitude,
          accuracy: gps.accuracy,
          timestamp: new Date(gps.timestamp).toISOString(),
        };
        const res = isStudentQr
          ? await attendanceService.scan(body)
          : await coachPortalService.scan(body);
        if (cancelled) return;
        const attendance = res.data?.data?.attendance || null;
        setDone(attendance);
        toast.success(formatAttendanceScanSuccess(attendance) || res.data?.message || 'Attendance marked');
      } catch (err) {
        if (cancelled) return;
        const msg = getApiErrorMessage(err, err.message || 'Attendance failed');
        setErrorPopup({ title: 'Attendance not marked', message: msg });
        toast.error(msg);
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loading, user, isStudent, isCoach, payload, toast]);

  const goLogin = () => {
    navigate(loginPath, { replace: true });
  };

  if (loading) return <PageLoader message="Checking account…" />;

  // Guest / not registered — only popup, no website homepage
  if (guestBlocked) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071A35]/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <FaUserSlash className="text-3xl" aria-hidden />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink">You are not registered</h1>
          <p className="mt-2 text-sm text-muted">Raghunandan Akhada</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Attendance ke liye pehle website par login karein. Agar aapka account nahi hai to registration / admin se contact karein.
          </p>

          <button
            type="button"
            onClick={goLogin}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#2563EB] px-4 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#1d4ed8] active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
              <FaSignInAlt className="text-lg" aria-hidden />
            </span>
            Login
          </button>
        </div>
      </div>
    );
  }

  if (errorPopup) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071A35]/85 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <FaExclamationTriangle className="text-3xl" aria-hidden />
          </div>
          <h1 className="mt-4 text-lg font-bold text-ink">{errorPopup.title}</h1>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{errorPopup.message}</p>
          {!user ? (
            <button
              type="button"
              onClick={goLogin}
              className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[#2563EB] px-4 py-3.5 text-base font-semibold text-white shadow-md transition hover:bg-[#1d4ed8]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <FaSignInAlt className="text-lg" aria-hidden />
              </span>
              Login
            </button>
          ) : (
            <Button
              className="mt-6 w-full rounded-xl"
              onClick={() => navigate(isCoach ? '/coach' : isStudent ? '/student' : '/login', { replace: true })}
            >
              OK
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[50] flex items-center justify-center bg-[#071A35]/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
        <img src={logoImg} alt="" className="mx-auto h-14 w-14 rounded-full object-contain" />
        <h1 className="mt-3 text-xl font-bold text-ink">Raghunandan Akhada</h1>
        <p className="mt-1 text-sm text-muted">Attendance</p>

        {busy ? <p className="mt-6 text-sm text-muted">Marking attendance… Please wait.</p> : null}

        {done ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left text-sm text-emerald-900">
            <p className="font-bold">✓ Attendance Marked</p>
            <p className="mt-2">{done.name || done.studentName || done.coachName}</p>
            <p>
              Present · {done.time} · {done.sourceLabel || done.method || 'QR'}
            </p>
            {(done.distanceFromAkhada != null || done.distanceMeters != null) && (
              <p>Distance: {Math.round(done.distanceFromAkhada ?? done.distanceMeters)} m</p>
            )}
            <Button
              className="mt-4 w-full rounded-lg"
              onClick={() => navigate(isCoach ? '/coach' : '/student', { replace: true })}
            >
              Open Dashboard
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
