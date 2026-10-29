function ProgressChart({ points }) {
  if (!points?.length) {
    return <p className="text-sm text-slate-400">No scored interviews yet, so there is no progress line to draw.</p>;
  }

  const width = 560;
  const height = 180;
  const pad = 28;
  const max = Math.max(10, ...points.map((item) => item.average));
  const step = points.length === 1 ? 0 : (width - pad * 2) / (points.length - 1);
  const coords = points.map((item, index) => {
    const x = pad + index * (step || 0);
    const y = height - pad - (item.average / max) * (height - pad * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img" aria-label="Interview score progress">
      <polyline fill="none" stroke="#8b5cf6" strokeWidth="3" points={coords.join(' ')} />
      {points.map((item, index) => {
        const [x, y] = coords[index].split(',');
        return <circle key={item.id} cx={x} cy={y} r="4" fill="#c4b5fd" />;
      })}
    </svg>
  );
}

export default ProgressChart;
