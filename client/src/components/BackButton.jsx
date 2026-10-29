import { useNavigate } from 'react-router-dom';

/**
 * BackButton - a small arrow button that navigates back one step in the
 * browser history, or falls back to /dashboard if there is no history.
 *
 * Props:
 *   to      - optional explicit path to navigate to (overrides history.back)
 *   label   - button text (default: "← Back")
 *   className - extra Tailwind classes
 */
function BackButton({ to, label = '← Back', className = '' }) {
  const navigate = useNavigate();

  function handleClick() {
    if (to) {
      navigate(to);
    } else if (window.history.length > 1) {
      navigate(-1);          // go to previous page in browser history
    } else {
      navigate('/dashboard'); // fallback: straight to dashboard
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 ${className}`}
    >
      {label}
    </button>
  );
}

export default BackButton;

