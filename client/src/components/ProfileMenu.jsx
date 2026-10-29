import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    function onClick(event) {
      if (root.current && !root.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) return null;

  function onLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        {initials(user.name)}
        <span className="sr-only">Open profile menu</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-navy-800 py-2 shadow-glow"
        >
          <p className="px-4 pb-2 text-xs text-slate-400">{user.email}</p>
          <Link to="/profile" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setOpen(false)}>
            Edit profile
          </Link>
          <Link to="/profile" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setOpen(false)}>
            Change target role
          </Link>
          <Link to="/settings" className="block px-4 py-2 text-sm text-slate-200 hover:bg-white/5" onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button type="button" className="block w-full px-4 py-2 text-left text-sm text-red-200 hover:bg-white/5" onClick={onLogout}>
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileMenu;
