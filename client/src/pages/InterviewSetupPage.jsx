import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const jobRoles = [
  'Frontend Developer',
  'Backend Developer',
  'MERN Stack Developer',
  'Java Developer',
  'Python Developer',
  'Custom Role',
];
const interviewTypes = ['Technical', 'HR', 'Behavioral', 'Mixed'];
const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
const topicOptions = ['JavaScript', 'React', 'Node.js', 'Databases', 'Data Structures', 'System Design', 'Communication'];

function roleFromProfile(user) {
  const target = user?.targetRole || '';
  if (jobRoles.includes(target)) {
    return { jobRole: target, customRole: '' };
  }
  if (target) {
    return { jobRole: 'Custom Role', customRole: target };
  }
  return { jobRole: 'Frontend Developer', customRole: '' };
}

function InterviewSetupPage() {
  const { token, user, aiConfigured } = useAuth();
  const navigate = useNavigate();
  const defaults = roleFromProfile(user);
  const [form, setForm] = useState({
    jobRole: defaults.jobRole,
    customRole: defaults.customRole,
    interviewType: user?.preferredInterviewType || 'Technical',
    difficulty: user?.preferredDifficulty || 'Beginner',
    questionCount: user?.preferredQuestionCount || 5,
    topics: [],
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleTopic(topic) {
    setForm((current) => ({
      ...current,
      topics: current.topics.includes(topic)
        ? current.topics.filter((item) => item !== topic)
        : [...current.topics, topic],
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setError('');

    if (form.jobRole === 'Custom Role' && !form.customRole.trim()) {
      setError('Enter a custom role or choose a listed role.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api('/api/interviews', {
        method: 'POST',
        token,
        body: { ...form, questionCount: Number(form.questionCount) },
      });
      const interviewId = created.interview._id;
      await api(`/api/interviews/${interviewId}/start`, { method: 'POST', token });
      navigate(`/interview/${interviewId}`, { replace: true });
    } catch (err) {
      setError(err.errors?.[0]?.message || err.message || 'Unable to create interview');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <BackButton to="/dashboard" label="← Back to Dashboard" />
      </div>
      <h1 className="text-2xl font-semibold text-white">Start interview</h1>
      <p className="mt-2 text-sm text-slate-400">
        Defaults come from your profile and settings. LLM feedback is stored only when the server has a real API key.
      </p>
      <form onSubmit={onSubmit} className="card-surface mt-6 space-y-5">
        {error ? <Alert>{error}</Alert> : null}
        {!aiConfigured ? (
          <Alert>AI_API_KEY is not set. You can still practice with sample questions; scores will not be invented.</Alert>
        ) : null}
        <label className="block text-sm font-medium text-slate-200">
          Job role
          <select className="input-field mt-2" value={form.jobRole} onChange={(event) => update('jobRole', event.target.value)}>
            {jobRoles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>
        {form.jobRole === 'Custom Role' ? (
          <label className="block text-sm font-medium text-slate-200">
            Custom role
            <input
              className="input-field mt-2"
              value={form.customRole}
              onChange={(event) => update('customRole', event.target.value)}
              placeholder="e.g. Mobile Developer"
              maxLength={80}
            />
          </label>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-200">
            Interview type
            <select
              className="input-field mt-2"
              value={form.interviewType}
              onChange={(event) => update('interviewType', event.target.value)}
            >
              {interviewTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-200">
            Difficulty
            <select
              className="input-field mt-2"
              value={form.difficulty}
              onChange={(event) => update('difficulty', event.target.value)}
            >
              {difficulties.map((level) => (
                <option key={level}>{level}</option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-slate-200">Question count</legend>
          <div className="mt-2 flex gap-3">
            {[5, 10, 15].map((count) => (
              <label key={count} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm">
                <input
                  type="radio"
                  name="questionCount"
                  checked={form.questionCount === count}
                  onChange={() => update('questionCount', count)}
                />
                {count}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-medium text-slate-200">
            Topics <span className="text-slate-500">(optional)</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {topicOptions.map((topic) => (
              <label key={topic} className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.topics.includes(topic)} onChange={() => toggleTopic(topic)} />
                {topic}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating interview…' : 'Create and start'}
        </button>
      </form>
    </div>
  );
}

export default InterviewSetupPage;
