import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

function validate(form) {
  const errors = {};

  if (form.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  if (form.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

function RegisterPage() {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    targetRole: '',
  });
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
    const nextErrors = validate(form);
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        targetRole: form.targetRole.trim(),
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setServerError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="card-surface">
        <h1 className="text-2xl font-semibold text-white">Create an account</h1>
        <p className="mt-2 text-sm text-slate-400">Your profile is stored privately and passwords are hashed on the server.</p>
        {serverError && (
          <div className="mt-4">
            <Alert>{serverError}</Alert>
          </div>
        )}
        <form className="mt-6 grid gap-4" onSubmit={onSubmit} noValidate>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Full name
            <input className="input-field" name="name" value={form.name} onChange={update} autoComplete="name" />
            {errors.name && <span className="font-normal text-red-300">{errors.name}</span>}
          </label>
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
            Target role (optional)
            <input className="input-field" name="targetRole" value={form.targetRole} onChange={update} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Password
            <input
              className="input-field"
              name="password"
              type="password"
              value={form.password}
              onChange={update}
              autoComplete="new-password"
            />
            {errors.password && <span className="font-normal text-red-300">{errors.password}</span>}
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-200">
            Confirm password
            <input
              className="input-field"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={update}
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="font-normal text-red-300">{errors.confirmPassword}</span>}
          </label>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Register'}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-400">
          Already have an account?{' '}
          <Link className="text-violet-300 hover:text-white" to="/login">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

export default RegisterPage;
