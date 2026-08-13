import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import ValidationPopup from '../components/ui/ValidationPopup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function safeRedirectPath(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/attendance/scan')) return value;
  return null;
}

const PORTAL_COPY = {
  admin: {
    title: 'Admin Login',
    subtitle: 'Sign in to the academy admin dashboard.',
  },
  parent: {
    title: 'Parents Login',
    subtitle: 'Sign in with your family / student portal credentials.',
  },
  player: {
    title: 'Player Login',
    subtitle: 'Sign in to your athlete portal.',
  },
};

const PORTAL_MISMATCH = {
  admin: 'This login is for Admin only. Please use the Parents or Player login button for your account.',
  parent: 'This login is for Parents only. Please use the Admin or Player login button for your account.',
  player: 'This login is for Players only. Please use the Admin or Parents login button for your account.',
};

function resolveAccountKind(user) {
  if (!user) return 'unknown';
  if (user.isStudent || user.role === 'student' || user.accountType === 'student') return 'player';
  if (user.isCoach || user.role === 'coach' || user.accountType === 'coach' || user.coachId) return 'coach';
  if (user.isParent || user.role === 'parent' || user.accountType === 'parent' || user.roleSlug === 'parent') {
    return 'parent';
  }
  if (
    user.canAccessAdmin ||
    user.isSuperAdmin ||
    user.role === 'admin' ||
    user.roleSlug === 'super_admin' ||
    user.roleSlug === 'admin' ||
    (Array.isArray(user.permissions) && user.permissions.length > 0)
  ) {
    return 'admin';
  }
  return 'unknown';
}

function portalAllowsAccount(portal, kind) {
  if (!portal || !PORTAL_COPY[portal]) return true;
  if (portal === 'admin') return kind === 'admin';
  if (portal === 'parent') return kind === 'parent';
  if (portal === 'player') return kind === 'player';
  return true;
}

export default function Login() {
  const { login, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const portal = String(searchParams.get('portal') || '').toLowerCase();
  const portalCopy = PORTAL_COPY[portal] || {
    title: 'Welcome back',
    subtitle: 'Sign in to continue to your academy dashboard.',
  };
  const [error, setError] = useState('');
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const showValidation = (title, message) => {
    setError(message);
    setValidationPopup({ open: true, title, message });
    toast.error(message);
  };

  const onInvalid = (formErrors) => {
    const message =
      formErrors.login?.message || formErrors.password?.message || 'Please fill all required fields.';
    showValidation('Validation required', message);
  };

  const onSubmit = async (data) => {
    setError('');
    try {
      const user = await login({ login: data.login.trim(), password: data.password });
      const kind = resolveAccountKind(user);

      if (!portalAllowsAccount(portal, kind)) {
        await logout();
        showValidation('Wrong login portal', PORTAL_MISMATCH[portal] || 'This account cannot use this login.');
        return;
      }

      const redirect = safeRedirectPath(searchParams.get('redirect'));
      if (redirect) {
        navigate(redirect, { replace: true });
        return;
      }

      if (kind === 'player') navigate('/student');
      else if (kind === 'coach') navigate('/coach');
      else if (kind === 'parent') navigate('/parent');
      else if (kind === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      const network =
        err?.code === 'ERR_NETWORK' ||
        err?.message === 'Network Error' ||
        !err?.response;
      const msg = network
        ? 'Cannot reach API server. Make sure the backend is running on port 5000 (and only one server is using that port).'
        : err.response?.data?.message || 'Login failed';
      showValidation('Login failed', msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F7F2] px-4">
      <div className="w-full max-w-md border border-[#E9E7DE] bg-white p-8 shadow-[0_16px_40px_rgba(7,26,43,0.08)]">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="mb-1 text-center font-display text-2xl font-extrabold text-[#071A2B]">{portalCopy.title}</h1>
        <p className="mb-6 text-center text-sm text-[#64748B]">{portalCopy.subtitle}</p>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-4" noValidate>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#172033]">Username</span>
            <input
              type="text"
              autoComplete="username"
              className={`w-full rounded-[12px] border px-3.5 py-2.5 text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/25 ${
                errors.login ? 'border-red-400' : 'border-[#E9E7DE]'
              }`}
              placeholder="username, email or registration / coach ID"
              {...register('login', {
                required: 'Please enter your username.',
              })}
            />
            {errors.login && <span className="mt-1 block text-xs text-red-500">{errors.login.message}</span>}
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-[#172033]">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              className={`w-full rounded-[12px] border px-3.5 py-2.5 text-sm outline-none focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/25 ${
                errors.password ? 'border-red-400' : 'border-[#E9E7DE]'
              }`}
              {...register('password', { required: 'Please enter your password.' })}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-500">{errors.password.message}</span>
            )}
          </label>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm font-medium text-[#071A33] hover:text-[#C89B3C]">
              Forgot Password?
            </Link>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Login'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-[#667085]">
          <Link to="/" className="font-medium text-[#071A33] hover:text-[#C89B3C]">
            Back to website
          </Link>
        </p>
      </div>

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />
    </div>
  );
}
