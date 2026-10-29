import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressChart from '../components/ProgressChart';
import AiStatusBanner from '../components/AiStatusBanner';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function TopicList({ title, items, empty }) {
  return (
    <article className="card-surface">
      <h2 className="font-semibold text-white">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.topic} className="flex justify-between gap-3 text-slate-300">
              <span>{item.topic}</span>
              <span>
                {item.average}/10 · {item.count} answers
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PerformancePage() {
  const { token, aiConfigured } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await api('/api/performance', { token });
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4">
        <BackButton to="/dashboard" label="← Back to Dashboard" />
      </div>
      <h1 className="text-2xl font-semibold text-white">Performance</h1>
      <p className="mt-2 text-sm text-slate-400">
        Every number comes from interviews and LLM evaluations stored for your account.
      </p>
      <div className="mt-4">
        <AiStatusBanner aiConfigured={aiConfigured} />
      </div>
      {error ? <Alert>{error}</Alert> : null}

      {!data || data.stats.completedInterviews === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No completed interviews yet"
            description="Finish a session to populate statistics. This page will not invent averages."
            action={
              <Link to="/interview/setup" className="btn-primary">
                Start interview
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="card-surface">
              <p className="text-xs uppercase text-slate-500">Completed</p>
              <p className="mt-2 text-2xl font-semibold">{data.stats.completedInterviews}</p>
            </article>
            <article className="card-surface">
              <p className="text-xs uppercase text-slate-500">Evaluated answers</p>
              <p className="mt-2 text-2xl font-semibold">{data.stats.evaluatedAnswers}</p>
            </article>
            <article className="card-surface">
              <p className="text-xs uppercase text-slate-500">Average score</p>
              <p className="mt-2 text-2xl font-semibold">
                {data.stats.overallAverage != null ? `${data.stats.overallAverage}/10` : '—'}
              </p>
            </article>
          </section>

          <section className="card-surface">
            <h2 className="font-semibold text-white">Progress</h2>
            <div className="mt-3">
              <ProgressChart points={data.progress} />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <TopicList
              title="Strong topics"
              items={data.strongTopics}
              empty="No topic has an average of 7/10 or higher yet."
            />
            <TopicList
              title="Weak topics"
              items={data.weakTopics}
              empty="No topic is currently below 6/10, or there is not enough scored data."
            />
          </section>

          <section>
            <h2 className="font-semibold text-white">Interview history</h2>
            <div className="mt-3 space-y-3">
              {data.history.map((item) => (
                <article key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-navy-800 p-4">
                  <div>
                    <p className="text-white">{item.role}</p>
                    <p className="text-sm text-slate-400">
                      {item.interviewType} · {item.difficulty}
                      {item.average != null ? ` · ${item.average}/10` : ' · no LLM score'}
                    </p>
                  </div>
                  <Link to={`/interview/${item.id}`} className="btn-secondary">
                    Review
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PerformancePage;
