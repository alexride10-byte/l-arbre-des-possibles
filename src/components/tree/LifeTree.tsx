import { useMemo } from "react";
import { DOMAINS, ROOTS, type Domain } from "@/data/domains";
import { branchGeometry, rootGeometry, trunkGeometry, seeded, VIEW } from "@/lib/tree-geometry";
import { useIsMobile } from "@/hooks/use-mobile";

const glow = (h: number, l = 0.8, c = 0.13) => `oklch(${l} ${c} ${h})`;
const LEAF = "M0,0 Q4,-3.2 9,0 Q4,3.2 0,0 Z";

interface Props {
  focusId: string | null;
  selectedNode: string | null;
  onFocus: (id: string) => void;
  onNode: (id: string) => void;
  onBack: () => void;
}

export function LifeTree({ focusId, selectedNode, onFocus, onNode, onBack }: Props) {
  const mobile = useIsMobile();
  const vb = mobile ? { x: 20, y: 40, w: 960, h: 760 } : { x: 0, y: -10, w: VIEW.w, h: VIEW.h + 10 };
  const geo = useMemo(() => branchGeometry(DOMAINS), []);
  const roots = useMemo(() => rootGeometry(ROOTS), []);
  const trunk = useMemo(() => trunkGeometry(), []);
  const particles = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 80 }, () => ({
      x: r() * VIEW.w, y: r() * VIEW.h * 0.85, s: 0.5 + r() * 1.6, d: 4 + r() * 8, delay: r() * 6,
    }));
  }, []);

  const clampX = (x: number, chars: number, px: number) => {
    const half = (chars * px * 0.7) / 2 + 8;
    return Math.min(Math.max(x, vb.x + half), vb.x + vb.w - half);
  };
  const fi = DOMAINS.findIndex((d) => d.id === focusId);
  const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
  const cam = fi >= 0 ? { x: geo[fi]!.end.x, y: geo[fi]!.end.y + 10, s: mobile ? 2.9 : 2.7 } : { x: cx, y: cy, s: 1 };
    const transform = `translate(${cx}px, ${cy}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`;

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Arbre de vie Enfance+"
      onClick={(e) => { if (e.target === e.currentTarget && focusId) onBack(); }}
    >
      <defs>
        <radialGradient id="aura" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--tree-aura)" stopOpacity="0.4" />
          <stop offset="60%" stopColor="var(--tree-aura)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--tree-aura)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bark" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--bark-dark)" />
          <stop offset="45%" stopColor="var(--bark-light)" />
          <stop offset="70%" stopColor="var(--bark-mid)" />
          <stop offset="100%" stopColor="var(--bark-dark)" />
        </linearGradient>
        <linearGradient id="barkV" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--bark-dark)" />
          <stop offset="100%" stopColor="var(--bark-light)" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8" /></filter>
        <filter id="halo" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.08" numOctaves="2" seed="3" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} className="particle"
          style={{ animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
      ))}

      <g className="camera" style={{ transform }}>
        <ellipse cx="500" cy="330" rx="480" ry="330" fill="url(#aura)" pointerEvents="none" />
        {DOMAINS.map((d, i) => (
          <circle key={d.id} cx={geo[i]!.end.x} cy={geo[i]!.end.y} r="85" fill={glow(d.hue, 0.6, 0.12)} opacity="0.22" filter="url(#soft)" pointerEvents="none" />
        ))}
        <ellipse cx="500" cy="645" rx="380" ry="20" fill="var(--tree-aura)" opacity="0.18" filter="url(#soft)" />

        {/* Racines : contextes */}
        <g className="roots">
          {roots.map((r, i) => (
            <g key={i}>
              <path d={r.body} fill="url(#barkV)" opacity={r.label ? 0.95 : 0.6} />
              <path d={r.spine} stroke="var(--tree-aura)" strokeWidth="0.8" fill="none" opacity="0.5" className="sap" />
              {r.label && (
                <>
                  <circle cx={r.end.x} cy={r.end.y} r="3" fill="var(--gold)" filter="url(#halo)" />
                  <text x={mobile ? clampX(r.end.x, r.label.length, 19) : r.end.x} y={r.end.y + 20 + (mobile && i % 4 === 2 ? 28 : 0)} textAnchor="middle" className="root-label">{r.label}</text>
                </>
              )}
            </g>
          ))}
        </g>

        {/* Branches */}
        {DOMAINS.map((d: Domain, i) => {
          const g = geo[i]!;
          const active = focusId === d.id;
          const dim = focusId && !active;
          return (
            <g key={d.id} className="branch" style={{ opacity: dim ? 0.3 : 1 }}>
              {g.twigs.map((t, k) => <path key={k} d={t} fill="url(#bark)" />)}
              <path d={g.body} fill="url(#bark)" />
              <path d={g.body} fill="var(--bark-light)" filter="url(#grain)" />
              <path d={g.spine} stroke={glow(d.hue, 0.82, 0.15)} strokeWidth="1.4" fill="none" className="sap" filter="url(#halo)" opacity="0.8" />
              <g className="foliage">
                {g.leaves.map((l, k) => (
                  <path key={k} d={LEAF}
                    transform={`translate(${l.x.toFixed(1)},${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${(l.r / 4.5).toFixed(2)})`}
                    fill={l.tone < 0.55 ? glow(d.hue, 0.78, 0.14) : l.tone < 0.8 ? "var(--tree-aura)" : "var(--gold)"}
                    opacity={0.45 + l.tone * 0.4} />
                ))}
              </g>
              <g
                role="button" tabIndex={0} aria-label={`Explorer le domaine ${d.name}`}
                className="branch-hit"
                onClick={(e) => { e.stopPropagation(); onFocus(d.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(d.id); } }}
              >
                <path d={g.spine} stroke="transparent" strokeWidth="40" fill="none" />
                <circle cx={g.end.x} cy={g.end.y} r="60" fill="transparent" />
                <circle cx={g.end.x} cy={g.end.y} r={active ? 4 : 6} fill={glow(d.hue, 0.92, 0.12)} filter="url(#halo)" className="core" />
                {!focusId && (
                  <text x={mobile ? clampX(g.label.x, d.name.split(" ")[0]!.length, 36) : g.label.x} y={g.label.y} textAnchor="middle" className="branch-label"
                    style={{ fill: glow(d.hue, 0.9, 0.11) }}>{d.name.split(" ")[0]}</text>
                )}
              </g>
              {/* Sous-branches révélées au zoom */}
              <g style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }} className="subnodes">
                {d.nodes.map((n, k) => {
                  const p = g.nodes[k]!;
                  const sel = selectedNode === n.id;
                  const above = p.y < g.end.y;
                  const w = n.label.length * (mobile ? 5 : 3.3) + 10;
                  const h = mobile ? 14 : 10;
                  return (
                    <g key={n.id} role="button" tabIndex={active ? 0 : -1} aria-label={n.label} className="subnode"
                      onClick={(e) => { e.stopPropagation(); onNode(n.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") onNode(n.id); }}>
                      <path d={g.reveal[k]} stroke="url(#bark)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
                      <path d={g.reveal[k]} stroke={glow(d.hue, 0.85, 0.15)} strokeWidth="0.5" fill="none" className="sap" />
                      <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                      <circle cx={p.x} cy={p.y} r={sel ? 5.5 : 4} className={`kind-${n.kind}`} strokeWidth={sel ? 1.2 : 0.6} filter="url(#halo)" />
                      <rect x={p.x - w / 2} y={p.y + (above ? -8 - h : 8)} width={w} height={h} rx="5"
                        fill="var(--background)" fillOpacity="0.8" stroke={glow(d.hue, 0.8, 0.13)} strokeWidth={sel ? 0.8 : 0.35} />
                      <text x={p.x} y={p.y + (above ? -8 - h * 0.3 : 8 + h * 0.7)} textAnchor="middle" className="sub-label">{n.label}</text>
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}

        {/* Tronc (au premier plan, couvre la base des branches) */}
        <path d={trunk.body} fill="url(#bark)" />
        <path d={trunk.body} fill="var(--bark-light)" filter="url(#grain)" />
        {trunk.veins.map((v, i) => (
          <path key={i} d={v} stroke={i % 3 === 1 ? "var(--tree-aura)" : "var(--bark-dark)"} strokeWidth={i % 3 === 1 ? 0.9 : 1.6}
            fill="none" opacity={i % 3 === 1 ? 0.45 : 0.7} className={i % 3 === 1 ? "sap" : undefined} />
        ))}
        <path d={trunk.spine} stroke="var(--gold)" strokeWidth="1.4" fill="none" className="sap" filter="url(#halo)" />
        <ellipse cx="500" cy="470" rx="70" ry="50" fill="url(#heart)" className="core" />
      </g>
    </svg>
  );
}
