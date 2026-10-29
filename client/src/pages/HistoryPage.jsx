import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function HistoryPage() {
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await api('/api/interviews', { token });
        if (!cancelled) setInterviews(data.interviews || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load interview history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <BackButton to="/dashboard" label="← Back to Dashboard" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Interview history</h1>
          <p className="mt-2 text-sm text-slate-400">Only sessions that belong to your account are listed.</p>
        </div>
        <Link to="/interview/setup" className="btn-primary">
          New interview
        </Link>
      </div>
      <div className="mt-6">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <Alert>{error}</Alert>
        ) : interviews.length === 0 ? (
          <EmptyState
            title="No interviews yet"
            description="Create your first mock interview to see it here."
            action={
              <Link to="/interview/setup" className="btn-primary">
                Start interview
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {interviews.map((interview) => (
              <article key={interview._id} className="card-surface">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-white">{interview.displayRole || interview.jobRole}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {interview.interviewType} · {interview.difficulty} · {interview.questionCount} questions
                    </p>
                  </div>
                  <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium capitalize text-violet-100">
                    {interview.status}
                  </span>
                </div>
                {interview.topics?.length ? (
                  <p className="mt-3 text-sm text-slate-400">Topics: {interview.topics.join(', ')}</p>
                ) : null}
                <Link to={`/interview/${interview._id}`} className="btn-secondary mt-4">
                  {interview.status === 'completed' ? 'Review' : 'Continue'}
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryPage;
