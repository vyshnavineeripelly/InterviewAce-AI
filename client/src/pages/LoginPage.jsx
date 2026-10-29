import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

function LoginPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  function update(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      nextErrors.password = 'Password is required.';
    }
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="card-surface">
        <h1 className="text-2xl font-semibold text-white">Log in</h1>
        <p className="mt-2 text-sm text-slate-400">Use the email and password you registered with.</p>
        {serverError && (
          <div className="mt-4">
            <Alert>{serverError}</Alert>
          </div>
        )}
        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Email
            <input
              className="input-field"
              name="email"
              type="email"
              value={form.email}
              onChange={update}
              autoComplete="email"
            />
            {errors.email && <span className="font-normal text-red-300">{errors.email}</span>}
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Password
            <input
              className="input-field"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              autoComplete="current-password"
            />
            {errors.password && <span className="font-normal text-red-300">{errors.password}</span>}
          </label>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          New here?{' '}
          <Link className="text-violet-300 hover:text-white" to="/register">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}

export default LoginPage;
