import { useMemo } from "react";
import { DOMAINS, ROOTS, type Domain } from "@/data/domains";
import { branchGeometry, seeded, GROUND_Y, TRUNK_TOP, VIEW } from "@/lib/tree-geometry";

const glow = (h: number, l = 0.8, c = 0.13) => `oklch(${l} ${c} ${h})`;

interface Props {
  focusId: string | null;
  selectedNode: string | null;
  onFocus: (id: string) => void;
  onNode: (id: string) => void;
  onBack: () => void;
}

export function LifeTree({ focusId, selectedNode, onFocus, onNode, onBack }: Props) {
  const geo = useMemo(() => branchGeometry(DOMAINS), []);
  const particles = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 60 }, () => ({
      x: r() * VIEW.w, y: r() * VIEW.h, s: 0.6 + r() * 1.8, d: 4 + r() * 8, delay: r() * 6,
    }));
  }, []);

  const fi = DOMAINS.findIndex((d) => d.id === focusId);
  const cam = fi >= 0 ? { x: geo[fi]!.end.x + 40, y: geo[fi]!.end.y + 10, s: 2.6 } : { x: 500, y: 410, s: 1 };
  const transform = `translate(${VIEW.w / 2}px, ${VIEW.h / 2}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`;

  const roots = ROOTS.map((label, i) => {
    const t = i / (ROOTS.length - 1);
    const ex = 180 + t * 640;
    const ey = 745 + Math.sin(t * Math.PI) * 25;
    return { label, ex, ey, d: `M${470 + t * 60},${GROUND_Y} C${490 + t * 20},${GROUND_Y + 60} ${ex + (500 - ex) * 0.3},${ey - 40} ${ex},${ey}` };
  });

  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Arbre de vie Enfance+"
      onClick={(e) => { if (e.target === e.currentTarget && focusId) onBack(); }}
    >
      <defs>
        <radialGradient id="aura" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--tree-aura)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--tree-aura)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bark" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--bark-dark)" />
          <stop offset="50%" stopColor="var(--bark-light)" />
          <stop offset="100%" stopColor="var(--bark-dark)" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        <filter id="halo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} className="particle"
          style={{ animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
      ))}

      <g className="camera" style={{ transform }}>
        <ellipse cx="500" cy="380" rx="460" ry="360" fill="url(#aura)" />
        <ellipse cx="500" cy={GROUND_Y} rx="360" ry="16" fill="var(--tree-aura)" opacity="0.15" filter="url(#soft)" />

        {/* Racines : contextes */}
        <g className="roots">
          {roots.map((r) => (
            <g key={r.label}>
              <path d={r.d} stroke="url(#bark)" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.85" />
              <path d={r.d} stroke="var(--gold)" strokeWidth="1" fill="none" opacity="0.5" className="sap" />
              <circle cx={r.ex} cy={r.ey} r="4" fill="var(--gold)" filter="url(#halo)" />
              <text x={r.ex} y={r.ey + 22} textAnchor="middle" className="root-label">{r.label}</text>
            </g>
          ))}
        </g>

        {/* Tronc */}
        <path
          d={`M440,${GROUND_Y} C460,560 470,500 ${TRUNK_TOP.x - 30},${TRUNK_TOP.y} L${TRUNK_TOP.x + 30},${TRUNK_TOP.y} C530,500 540,560 560,${GROUND_Y} Z`}
          fill="url(#bark)"
        />
        <path d={`M500,${GROUND_Y} C495,560 505,500 500,${TRUNK_TOP.y}`} stroke="var(--gold)" strokeWidth="1.5" fill="none" className="sap" />

        {/* Liens possibles, non causaux */}
        {geo.map((g, i) => {
          const n = geo[i + 1];
          if (!n) return null;
          const mx = (g.end.x + n.end.x) / 2, my = Math.min(g.end.y, n.end.y) - 40;
          return <path key={i} d={`M${g.end.x},${g.end.y} Q${mx},${my} ${n.end.x},${n.end.y}`}
            className="link" fill="none" />;
        })}

        {/* Branches */}
        {DOMAINS.map((d: Domain, i) => {
          const g = geo[i]!;
          const active = focusId === d.id;
          const dim = focusId && !active;
          return (
            <g key={d.id} className="branch" style={{ opacity: dim ? 0.25 : 1 }}>
              <path d={g.path} stroke="url(#bark)" strokeWidth="13" fill="none" strokeLinecap="round" />
              <path d={g.path} stroke={glow(d.hue)} strokeWidth="2" fill="none" className="sap" filter="url(#halo)" />
              <g
                role="button" tabIndex={0} aria-label={`Explorer le domaine ${d.name}`}
                className="branch-hit"
                onClick={(e) => { e.stopPropagation(); onFocus(d.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onFocus(d.id); }}
              >
                <path d={g.path} stroke="transparent" strokeWidth="34" fill="none" />
                <circle cx={g.end.x} cy={g.end.y} r="38" fill={glow(d.hue, 0.7, 0.12)} opacity="0.25" filter="url(#soft)" />
                <circle cx={g.end.x} cy={g.end.y} r={active ? 9 : 13} fill={glow(d.hue, 0.88)} filter="url(#halo)" className="core" />
                {!focusId && (
                  <text x={g.end.x} y={g.end.y - 26} textAnchor="middle" className="branch-label">{d.name}</text>
                )}
              </g>
              {/* Sous-nœuds */}
              <g style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }} className="subnodes">
                {d.nodes.map((n, k) => {
                  const p = g.nodes[k]!;
                  const sel = selectedNode === n.id;
                  return (
                    <g key={n.id} role="button" tabIndex={active ? 0 : -1} aria-label={n.label} className="subnode"
                      onClick={(e) => { e.stopPropagation(); onNode(n.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") onNode(n.id); }}>
                      <line x1={g.end.x} y1={g.end.y} x2={p.x} y2={p.y} stroke={glow(d.hue)} strokeWidth="0.6" opacity="0.6" />
                      <circle cx={p.x} cy={p.y} r={sel ? 7 : 5} className={`kind-${n.kind}`} strokeWidth={sel ? 1.5 : 0.8} filter="url(#halo)" />
                      <text x={p.x} y={p.y + (p.y < g.end.y ? -10 : 15)} textAnchor="middle" className="sub-label">{n.label}</text>
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
