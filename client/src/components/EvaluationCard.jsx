/**
 * Coloured pill showing ✓ Correct / ✗ Incorrect / ~ Partial
 * based on the "correctness" score (out of 10).
 */
function CorrectnessBadge({ score }) {
  if (score == null) return null;

  let label, colorClass, icon;
  if (score >= 7) {
    label = 'Correct';
    colorClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    icon = '✓';
  } else if (score >= 4) {
    label = 'Partially correct';
    colorClass = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    icon = '~';
  } else {
    label = 'Incorrect';
    colorClass = 'bg-red-500/15 text-red-400 border-red-500/30';
    icon = '✗';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      <span>{icon}</span>
      {label}
      <span className="opacity-60">({score}/10)</span>
    </span>
  );
}

/** Score bar — thin coloured progress bar for a 0-10 score */
function ScoreBar({ score }) {
  if (score == null) return null;
  const pct = (score / 10) * 100;
  const barColor =
    score >= 7 ? 'bg-emerald-500' : score >= 4 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Bulleted list with a coloured accent */
function List({ title, items, accent = 'text-slate-400' }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <h4 className={`text-xs font-semibold uppercase tracking-[0.14em] ${accent}`}>{title}</h4>
      <ul className="mt-1.5 space-y-1 pl-4 text-slate-300">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`mt-0.5 shrink-0 ${accent}`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * EvaluationCard — shown after each answer is saved.
 * Displays: correct/wrong badge, score breakdown, feedback, strengths,
 * weaknesses, missing concepts, improvement tips, and a model answer.
 */
function EvaluationCard({ evaluation }) {
  if (!evaluation) {
    return (
      <p className="mt-4 rounded-xl border border-white/10 bg-navy-900/60 p-4 text-sm text-slate-400">
        No AI feedback stored for this answer — the server never invents scores.
        Add a real <code className="text-violet-300">AI_API_KEY</code> in{' '}
        <code className="text-violet-300">server/.env</code> to enable feedback.
      </p>
    );
  }

  const scoreKeys = ['correctness', 'relevance', 'completeness', 'clarity', 'overall'];
  const hasScores = scoreKeys.some((k) => evaluation[k] != null);

  return (
    <section className="mt-4 space-y-4 rounded-xl border border-white/10 bg-navy-900 p-4 text-sm">

      {/* ── Header row: title + correct/wrong badge ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">AI Practice Feedback</h3>
        <CorrectnessBadge score={evaluation.correctness} />
      </div>

      <p className="text-xs text-slate-500">
        Scores are practice estimates — not a hiring decision.
      </p>

      {/* ── Score grid with bars ── */}
      {hasScores && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-5">
          {scoreKeys.map((key) =>
            evaluation[key] == null ? null : (
              <div key={key}>
                <div className="flex items-baseline justify-between">
                  <dt className="capitalize text-slate-500">{key}</dt>
                  <dd
                    className={`font-semibold ${
                      evaluation[key] >= 7
                        ? 'text-emerald-400'
                        : evaluation[key] >= 4
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {evaluation[key]}/10
                  </dd>
                </div>
                <ScoreBar score={evaluation[key]} />
              </div>
            )
          )}
        </div>
      )}

      {/* ── General feedback ── */}
      {evaluation.feedback && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Feedback</p>
          <p className="mt-1 leading-relaxed text-slate-200">{evaluation.feedback}</p>
        </div>
      )}

      {/* ── Strengths ── */}
      <List title="✓  What you got right" items={evaluation.strengths} accent="text-emerald-500" />

      {/* ── Mistakes / Weaknesses ── */}
      <List title="✗  Mistakes" items={evaluation.mistakes} accent="text-red-400" />
      <List title="⚠  Weaknesses" items={evaluation.weaknesses} accent="text-yellow-400" />

      {/* ── Where to improve ── */}
      {(evaluation.missingConcepts?.length || evaluation.improvementTips?.length) && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-400">
            Where to improve
          </p>
          <List title="Missing concepts" items={evaluation.missingConcepts} accent="text-violet-400" />
          <List title="Improvement tips"  items={evaluation.improvementTips}  accent="text-violet-400" />
        </div>
      )}

      {/* ── Model / correct answer ── */}
      {(evaluation.correctAnswer || evaluation.improvedAnswer) && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
            Sample strong answer
          </p>
          <p className="mt-1 leading-relaxed text-slate-200">
            {evaluation.correctAnswer || evaluation.improvedAnswer}
          </p>
        </div>
      )}
    </section>
  );
}

export default EvaluationCard;
