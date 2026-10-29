import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${
      isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3" aria-label="Main">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          InterviewAce <span className="text-violet-400">AI</span>
        </Link>

        <button
          type="button"
          className="btn-secondary px-3 py-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <a href="/#how-it-works" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:text-white">
            How it works
          </a>
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass}>
                Dashboard
              </NavLink>
              <button type="button" className="btn-secondary" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>
                Log in
              </NavLink>
              <NavLink to="/register" className="btn-primary">
                Get started
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {open && (
        <div id="mobile-nav" className="space-y-2 border-t border-white/10 px-4 py-3 md:hidden">
          <a href="/#how-it-works" className="block rounded-lg px-3 py-2 text-sm text-slate-300" onClick={() => setOpen(false)}>
            How it works
          </a>
          {user ? (
            <>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Log in
              </NavLink>
              <NavLink to="/register" className="btn-primary w-full" onClick={() => setOpen(false)}>
                Get started
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
