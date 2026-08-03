import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import { authService } from '../services';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../utils/apiError';

const STRONG = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function ResetPassword() {
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = useMemo(() => params.get('token') || '', [params]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Invalid or missing reset token');
      return;
    }
    if (!password || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!STRONG.test(password)) {
      toast.error('Password must be 8+ characters with upper, lower and a number');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword({ token, password, confirmPassword });
      setDone(true);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reset failed'));
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
        <h1 className="text-center text-2xl font-bold text-ink">Reset Password</h1>

        {!token ? (
          <p className="mt-6 text-center text-sm text-red-600">
            Invalid reset link.{' '}
            <Link to="/forgot-password" className="font-semibold text-brand hover:underline">
              Request a new one
            </Link>
          </p>
        ) : done ? (
          <div className="mt-6 space-y-4 text-center">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Password reset successfully.</p>
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Login
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">New Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                placeholder="8+ chars, upper, lower, number"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium">Confirm New Password</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving…' : 'Reset Password'}
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
