import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Alert from '../components/Alert';
import LoadingSpinner from '../components/LoadingSpinner';
import AiStatusBanner from '../components/AiStatusBanner';

function DashboardPage() {
  const { user, token, loading, aiConfigured } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await api('/api/performance', { token });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading || !ready) {
    return <LoadingSpinner label="Loading your dashboard…" />;
  }

  if (!user) {
    return <Alert>Your session is missing profile data. Log out and sign in again.</Alert>;
  }

  const stats = data?.stats || {};

  return (
    <div className="mx-auto max-w-5xl">
      <AiStatusBanner aiConfigured={aiConfigured} />
      {error ? <Alert>{error}</Alert> : null}

      <section className="overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-navy-800 to-navy-950 p-6 shadow-glow md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Student workspace</p>
        <h1 className="mt-3 text-3xl font-bold text-white md:text-4xl">Welcome back, {user.name}.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Target role: {user.targetRole || 'Not set'}. Start a private mock interview, then review only the scores the
          server stored from the LLM.
        </p>
        <Link to="/interview/setup" className="btn-primary mt-6">
          Start interview
        </Link>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Interviews', stats.totalInterviews ?? 0],
          ['Completed', stats.completedInterviews ?? 0],
          ['Evaluated answers', stats.evaluatedAnswers ?? 0],
          ['Average score', stats.overallAverage != null ? `${stats.overallAverage}/10` : '—'],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl border border-white/10 bg-navy-800 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Recent interviews</h2>
          <Link to="/history" className="text-sm text-violet-300">
            View history
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {!data?.recent?.length ? (
            <p className="text-sm text-slate-400">No interviews yet. Start one to see it here.</p>
          ) : (
            data.recent.map((interview) => (
              <article key={interview._id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy-800 p-4">
                <div>
                  <p className="font-medium text-white">{interview.displayRole}</p>
                  <p className="text-sm text-slate-400">
                    {interview.interviewType} · {interview.difficulty} · {interview.status}
                  </p>
                </div>
                <Link to={`/interview/${interview._id}`} className="btn-secondary">
                  {interview.status === 'completed' ? 'Review' : 'Continue'}
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
