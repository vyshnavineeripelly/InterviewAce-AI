import { useState } from 'react';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';

function SettingsPage() {
  const { user, updateProfile, aiConfigured } = useAuth();
  const [form, setForm] = useState({
    preferredInterviewType: user?.preferredInterviewType || 'Technical',
    preferredDifficulty: user?.preferredDifficulty || 'Beginner',
    preferredQuestionCount: user?.preferredQuestionCount || 5,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      await updateProfile({
        preferredInterviewType: form.preferredInterviewType,
        preferredDifficulty: form.preferredDifficulty,
        preferredQuestionCount: Number(form.preferredQuestionCount),
      });
      setMessage('Settings saved. They will pre-fill the next interview setup.');
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
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-2 text-sm text-slate-400">These defaults are stored with your profile and used on Start interview.</p>
      <form className="card-surface mt-6 space-y-4" onSubmit={onSubmit}>
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert type="info">{message}</Alert> : null}
        {!aiConfigured ? (
          <Alert>LLM key is not configured on the server. Feedback will stay empty until AI_API_KEY is set.</Alert>
        ) : null}
        <label className="block text-sm font-medium">
          Preferred interview type
          <select
            className="input-field mt-2"
            value={form.preferredInterviewType}
            onChange={(event) => setForm((current) => ({ ...current, preferredInterviewType: event.target.value }))}
          >
            {['Technical', 'HR', 'Behavioral', 'Mixed'].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Preferred difficulty
          <select
            className="input-field mt-2"
            value={form.preferredDifficulty}
            onChange={(event) => setForm((current) => ({ ...current, preferredDifficulty: event.target.value }))}
          >
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <option key={level}>{level}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Preferred question count</legend>
          <div className="mt-2 flex gap-3">
            {[5, 10, 15].map((count) => (
              <label key={count} className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm">
                <input
                  type="radio"
                  checked={form.preferredQuestionCount === count}
                  onChange={() => setForm((current) => ({ ...current, preferredQuestionCount: count }))}
                />
                {count}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}

export default SettingsPage;
