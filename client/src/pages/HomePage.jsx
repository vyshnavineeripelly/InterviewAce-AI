import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Practice on your schedule',
    body: 'Set up a mock interview when you are ready. Sessions will be stored on your account so only you can review them.',
  },
  {
    title: 'Keep a private history',
    body: 'Past interviews stay behind login. Nothing is shown as completed until you actually finish a session.',
  },
  {
    title: 'See performance over time',
    body: 'Scores and trends appear after you have real results. Empty charts stay empty until there is data to show.',
  },
];

function HomePage() {
  const { user } = useAuth();

  return (
    <main>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">Mock interview practice</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Prepare for interviews with a private practice workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            InterviewAce AI is a student dashboard for mock interviews. Create an account, then start sessions, review
            history, and track performance as those features come online. Your answers stay tied to your login.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary">
                  Create a free account
                </Link>
                <Link to="/login" className="btn-secondary">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="card-surface">
          <h2 className="text-lg font-semibold text-white">What you can do today</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Register and log in with a hashed password stored on the server.</li>
            <li>Open a protected dashboard that only your account can see.</li>
            <li>Navigate to Start Interview, History, and Performance pages. Those pages stay empty until interviews exist.</li>
          </ul>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-white/10 bg-navy-900/50">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-semibold text-white">How it works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-white/10 bg-navy-800 p-5">
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
