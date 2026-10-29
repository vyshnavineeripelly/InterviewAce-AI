function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-300"
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default LoadingSpinner;
