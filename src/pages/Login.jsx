import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/ui/Logo';
import Button from '../components/ui/Button';
import ValidationPopup from '../components/ui/ValidationPopup';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onInvalid = (formErrors) => {
    const message =
      formErrors.email?.message || formErrors.password?.message || 'Please fill all required fields.';
    setValidationPopup({
      open: true,
      title: 'Validation required',
      message,
    });
    toast.error(message);
  };

  const onSubmit = async (data) => {
    setError('');
    try {
      const user = await login(data);
      if (user.canAccessAdmin || user.isSuperAdmin || user.role === 'admin' || (user.permissions || []).length) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
      setValidationPopup({ open: true, title: 'Login failed', message: msg });
      toast.error(msg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <h1 className="text-center text-2xl font-bold text-ink">Admin Login</h1>
        <p className="mt-1 text-center text-sm text-muted">Sign in to manage inquiries</p>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="mt-6 space-y-4" noValidate>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Email</span>
            <input
              type="email"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                errors.email ? 'border-red-400' : 'border-slate-200'
              }`}
              {...register('email', {
                required: 'Please enter your email.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address.',
                },
              })}
            />
            {errors.email && <span className="mt-1 block text-xs text-red-500">{errors.email.message}</span>}
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Password</span>
            <input
              type="password"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
                errors.password ? 'border-red-400' : 'border-slate-200'
              }`}
              {...register('password', { required: 'Please enter your password.' })}
            />
            {errors.password && (
              <span className="mt-1 block text-xs text-red-500">{errors.password.message}</span>
            )}
          </label>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          <Link to="/" className="text-brand hover:underline">
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
