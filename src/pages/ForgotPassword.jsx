import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import { authService } from '../services';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/apiError';

export default function ForgotPassword() {
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [devUrl, setDevUrl] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error('Please enter your username, email or mobile');
      return;
    }
    setSubmitting(true);
    setDevUrl('');
    try {
      const res = await authService.forgotPassword({ identifier: identifier.trim() });
      setDone(true);
      if (res.data?.data?.resetUrl) setDevUrl(res.data.data.resetUrl);
      toast.success(res.data?.message || 'If an account matches, reset instructions were sent.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Request failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold text-ink">Forgot Password</h1>
        <p className="mt-1 text-center text-sm text-muted">
          Enter your username, email or mobile. Works for Student and Coach accounts.
        </p>

        {done ? (
          <div className="mt-6 space-y-3 text-center">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              If an account matches that information, password reset instructions have been sent. Check your email.
            </p>
            {devUrl ? (
              <p className="break-all rounded-lg bg-amber-50 px-3 py-2 text-left text-xs text-amber-800">
                Dev reset link:{' '}
                <a href={devUrl} className="text-brand underline">
                  {devUrl}
                </a>
              </p>
            ) : null}
            <Link to="/login" className="inline-block text-sm font-semibold text-brand hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Username / Email / Mobile</span>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="coach_rahul or email or mobile"
                autoComplete="username"
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send Reset Instructions'}
            </Button>
            <p className="text-center text-sm text-muted">
              <Link to="/login" className="text-brand hover:underline">
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
