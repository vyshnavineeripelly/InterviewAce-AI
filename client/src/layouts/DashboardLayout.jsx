import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';

const links = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/interview/setup', label: 'Start interview' },
  { to: '/history', label: 'History' },
  { to: '/performance', label: 'Performance' },
];

function DashboardLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const itemClass = ({ isActive }) =>
    `block rounded-xl px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  const nav = (
    <nav aria-label="Dashboard">
      <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-500">Workspace</p>
      <ul className="space-y-1">
        {links.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.to === '/dashboard'} className={itemClass} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="min-h-screen bg-navy-950 md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-white/10 bg-navy-900 p-5 md:block">{nav}</aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-navy-900/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <button type="button" className="btn-secondary px-3 py-2 md:hidden" aria-expanded={open} onClick={() => setOpen(true)}>
              Menu
            </button>
            {/* InterviewAI Logo — replaces the "Signed in as …" text */}
            <Link to="/dashboard" className="flex items-center gap-2 select-none">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white">
                AI
              </div>
              <span className="hidden text-sm font-semibold tracking-wide text-white sm:block">
                Interview<span className="text-violet-400">Ace</span>
              </span>
            </Link>
          </div>
          <ProfileMenu />
        </header>

        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-navy-900 p-5">
            {nav}
          </aside>
        </div>
      )}
    </div>
  );
}

export default DashboardLayout;
