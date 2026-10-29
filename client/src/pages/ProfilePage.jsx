import { useState } from 'react';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';

const rolePresets = [
  'Frontend Developer',
  'Backend Developer',
  'MERN Stack Developer',
  'Java Developer',
  'Python Developer',
];

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    targetRole: user?.targetRole || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const preset = rolePresets.includes(form.targetRole) ? form.targetRole : form.targetRole ? 'Custom' : '';

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await updateProfile({ name: form.name.trim(), targetRole: form.targetRole.trim() });
      setMessage('Profile saved. New interviews will use this target role as the default.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4">
        <BackButton to="/dashboard" label="← Back to Dashboard" />
      </div>
      <h1 className="text-2xl font-semibold text-white">Edit profile</h1>
      <p className="mt-2 text-sm text-slate-400">Your name and target role are stored on the server for this account only.</p>
      <form className="card-surface mt-6 space-y-4" onSubmit={onSubmit}>
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert type="info">{message}</Alert> : null}
        <label className="block text-sm font-medium">
          Name
          <input
            className="input-field mt-2"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
            minLength={2}
          />
        </label>
        <label className="block text-sm font-medium">
          Target role
          <select
            className="input-field mt-2"
            value={preset}
            onChange={(event) => {
              const value = event.target.value;
              setForm((current) => ({
                ...current,
                targetRole: value === 'Custom' ? current.targetRole : value,
              }));
            }}
          >
            <option value="">Not set</option>
            {rolePresets.map((role) => (
              <option key={role}>{role}</option>
            ))}
            <option value="Custom">Custom role</option>
          </select>
        </label>
        {preset === 'Custom' || (form.targetRole && !rolePresets.includes(form.targetRole)) ? (
          <label className="block text-sm font-medium">
            Custom target role
            <input
              className="input-field mt-2"
              value={form.targetRole}
              onChange={(event) => setForm((current) => ({ ...current, targetRole: event.target.value }))}
              maxLength={80}
            />
          </label>
        ) : null}
        <p className="text-sm text-slate-400">{user?.email}</p>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </div>
  );
}

export default ProfilePage;
