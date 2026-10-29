function Alert({ type = 'error', children }) {
  const styles =
    type === 'error'
      ? 'border-red-400/30 bg-red-500/10 text-red-200'
      : 'border-violet-400/30 bg-violet-500/10 text-violet-100';

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="alert">
      {children}
    </div>
  );
}

export default Alert;
