import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Alert from '../components/Alert';
import BackButton from '../components/BackButton';
import LoadingSpinner from '../components/LoadingSpinner';
import EvaluationCard from '../components/EvaluationCard';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

function draftKey(interviewId, questionId) {
  return `interviewace_draft_${interviewId}_${questionId}`;
}

function sameId(left, right) {
  return String(left) === String(right);
}

function ActiveInterviewPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [interview, setInterview] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const questions = interview?.questions || [];
  const current = questions.find((item) => item.order === interview?.currentQuestionIndex) || questions[0];
  const currentResponse = useMemo(
    () =>
      interview?.responses?.find((item) => sameId(item.question?._id || item.question, current?._id)),
    [interview, current]
  );
  const isLast = interview && current && current.order === questions.length - 1;
  const completed = interview?.status === 'completed';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError('');
      try {
        const started = await api(`/api/interviews/${id}/start`, { method: 'POST', token });
        if (!cancelled) {
          setInterview(started.interview);
        }
      } catch (startError) {
        try {
          const loaded = await api(`/api/interviews/${id}`, { token });
          if (!cancelled) setInterview(loaded.interview);
        } catch (loadError) {
          if (!cancelled) setError(loadError.message || startError.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (token) load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  useEffect(() => {
    if (!interview || !current) return;
    if (currentResponse) {
      setAnswer(currentResponse.answerText);
      return;
    }
    const draft = localStorage.getItem(draftKey(interview._id, current._id));
    setAnswer(draft || '');
  }, [interview, current, currentResponse]);

  function onAnswerChange(event) {
    const value = event.target.value;
    setAnswer(value);
    if (interview && current && !currentResponse) {
      localStorage.setItem(draftKey(interview._id, current._id), value);
    }
  }

  async function saveAnswer(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    if (!answer.trim()) {
      setError('Write an answer before saving.');
      return;
    }

    setSaving(true);
    try {
      const data = await api(`/api/interviews/${id}/answers`, {
        method: 'POST',
        token,
        body: { questionId: current._id, answerText: answer },
      });
      localStorage.removeItem(draftKey(interview._id, current._id));
      setInterview(data.interview);
      if (data.evaluationError) {
        setNotice(data.evaluationError);
      } else if (data.evaluationSkipped) {
        setNotice('Answer saved. Add a real LLM API key in server/.env to store model evaluations. No scores were invented.');
      }
    } catch (err) {
      setError(err.message || 'Could not save the answer. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  async function goNext() {
    setError('');
    try {
      const data = await api(`/api/interviews/${id}/next`, { method: 'POST', token });
      setInterview(data.interview);
    } catch (err) {
      setError(err.message);
    }
  }

  async function finish() {
    setError('');
    try {
      const data = await api(`/api/interviews/${id}/finish`, { method: 'POST', token });
      setInterview(data.interview);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return <LoadingSpinner label="Loading interview…" />;
  }

  if (error && !interview) {
    return (
      <div className="mx-auto max-w-3xl">
        <Alert>{error}</Alert>
        <Link to="/history" className="btn-secondary mt-4">
          Back to history
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4">
        <BackButton to="/dashboard" label="← Back to Dashboard" />
      </div>
      <p className="text-sm text-slate-400">
        {interview.displayRole} · {interview.interviewType} · {interview.difficulty}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-white">
        {completed ? 'Interview review' : `Question ${current.order + 1} of ${questions.length}`}
      </h1>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className="h-full bg-violet-500"
          style={{ width: `${questions.length ? ((current.order + (currentResponse ? 1 : 0)) / questions.length) * 100 : 0}%` }}
        />
      </div>

      {error ? (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {notice ? (
        <div className="mt-4">
          <Alert type="info">{notice}</Alert>
        </div>
      ) : null}

      {completed ? (
        <div className="mt-6 space-y-5">
          {/* Summary bar */}
          <div className="rounded-xl border border-white/10 bg-navy-900 px-5 py-4">
            <p className="text-xs uppercase tracking-widest text-slate-500">Interview complete</p>
            <p className="mt-1 text-sm text-slate-300">
              Review each question below — see what you got right, what was wrong,
              and where to focus your practice next.
            </p>
          </div>

          {questions.map((question) => {
            const response = interview.responses.find((item) =>
              sameId(item.question?._id || item.question, question._id)
            );
            const score = response?.evaluation?.correctness ?? null;
            // Determine status colour
            const isCorrect  = score != null && score >= 7;
            const isPartial  = score != null && score >= 4 && score < 7;
            const isWrong    = score != null && score < 4;

            const statusLabel =
              score == null ? null : isCorrect ? '✓ Correct' : isPartial ? '~ Partially correct' : '✗ Incorrect';
            const statusClass =
              isCorrect  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' :
              isPartial  ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400'   :
              isWrong    ? 'border-red-500/40 bg-red-500/10 text-red-400'            :
                           'border-white/10 text-slate-400';

            return (
              <article
                key={question._id}
                className={`rounded-2xl border bg-navy-800 p-5 ${isCorrect ? 'border-emerald-500/20' : isWrong ? 'border-red-500/20' : isPartial ? 'border-yellow-500/20' : 'border-white/10'}`}
              >
                {/* Question header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-300">
                      Q{question.order + 1}{question.isFollowUp ? ' · Follow-up' : ''}
                    </span>
                    {question.topic && (
                      <span className="text-xs text-slate-500">{question.topic}</span>
                    )}
                  </div>
                  {statusLabel && (
                    <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}{score != null ? ` (${score}/10)` : ''}
                    </span>
                  )}
                </div>

                {/* Question text */}
                <p className="mt-3 font-medium text-white">{question.text}</p>

                {/* Your answer */}
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your answer</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-lg border border-white/10 bg-navy-900/60 px-3 py-2 text-slate-200">
                    {response?.answerText || <span className="italic text-slate-500">No answer saved.</span>}
                  </p>
                </div>

                {/* Feedback card */}
                <EvaluationCard evaluation={response?.evaluation} />
              </article>
            );
          })}

          <Link to="/history" className="btn-secondary">
            Back to history
          </Link>
        </div>
      ) : (
        <form className="card-surface mt-6" onSubmit={saveAnswer}>
          <p className="text-xs uppercase tracking-[0.16em] text-violet-300">
            {current.topic || 'Question'}
            {current.isFollowUp ? ' · Follow-up' : ''}
          </p>
          <p className="mt-3 text-lg text-white">{current.text}</p>
          <label className="mt-5 block text-sm font-medium text-slate-200">
            Your answer
            <textarea
              className="input-field mt-2 min-h-40"
              value={answer}
              onChange={onAnswerChange}
              disabled={Boolean(currentResponse) || saving}
            />
          </label>
          {currentResponse ? <EvaluationCard evaluation={currentResponse.evaluation} /> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {!currentResponse ? (
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save answer'}
              </button>
            ) : isLast ? (
              <button type="button" className="btn-primary" onClick={finish}>
                Finish interview
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={goNext}>
                Next question
              </button>
            )}
            <Link to="/history" className="btn-secondary">
              Save and exit
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

export default ActiveInterviewPage;
