export function ScoreRing({ value, size = 96, color = "#fbbf24", label }: { value: number; size?: number; color?: string; label?: string }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const gid = `sr-${size}-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <div className="score-ring" style={{ width: size, height: size }} data-testid="score-ring">
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop stopColor={color} /><stop offset="1" stopColor="#38bdf8" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(148,163,255,.14)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <span className="relative font-display font-bold" style={{ fontSize: size * 0.3 }}>{label ?? value}</span>
    </div>
  );
}
