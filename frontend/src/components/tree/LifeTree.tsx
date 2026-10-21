import { useEffect, useMemo, useRef, useState } from "react";
import { DOMAINS, ROOTS, type Domain } from "@/data/domains";
import { branchGeometry, rootGeometry, trunkGeometry, seeded, VIEW } from "@/lib/tree-geometry";
import { useIsMobile } from "@/hooks/use-mobile";
import { Heart, Users, Brain, BookOpen, Activity, Sprout, House, AlertTriangle, Zap, Focus, Moon, Wind, Handshake } from "lucide-react";
import { FactorNetwork } from "./FactorNetwork";
import { AvatarIllustration, type AvatarOptions } from "@/components/layout/AvatarIllustration";
import { portraitSrc } from "@/components/layout/Portrait";
import { PAINTED_TREE } from "@/lib/assets";
import { FRAGILITIES } from "@/data/fragilities";

const FRAG_POS = [{ x: 230, y: 624 }, { x: 340, y: 658 }, { x: 450, y: 634 }, { x: 560, y: 658 }, { x: 670, y: 634 }, { x: 780, y: 658 }];
const DOMAIN_ICONS = [Heart, Users, Brain, BookOpen, Activity, Sprout, House];
const FRAG_ICONS = [AlertTriangle, Zap, Focus, Moon, Wind, Handshake];

const glow = (h: number, l = 0.8, c = 0.13) => `oklch(${l} ${c} ${h})`;
const domainColor = (id: string) => `var(--domain-${id})`;
const LEAF = "M0,0 Q2,-5 10,-1 Q7,4 0,0 Z M1,0 L8,-1";

interface Props {
  avatar: AvatarOptions;
  focusId: string | null;
  selectedNode: string | null;
  onFocus: (id: string) => void;
  onNode: (id: string) => void;
  onBack: () => void;
  hidden?: string[];
  fragilityId?: string | null;
  onFragility?: (id: string) => void;
  onFactor?: (id: string) => void;
  selectedFactor?: string | null;
  levelLabels?: Record<string, string>;
  showAllNodes?: boolean;
  painted?: boolean;
}

export function LifeTree({ avatar, focusId, selectedNode, onFocus, onNode, onBack, hidden = [], fragilityId = null, onFragility, onFactor, selectedFactor, levelLabels = {}, showAllNodes = false, painted = true }: Props) {
  const mobile = useIsMobile();
  const svgRef = useRef<SVGSVGElement>(null);
  const [height, setHeight] = useState(830);
  useEffect(() => {
    const el = svgRef.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) setHeight(1000 * entry.contentRect.height / entry.contentRect.width);
    });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  const vb = { x: 0, y: 0, w: VIEW.w, h: height };
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
  const cx = 500, cy = height / 2;
  const focusedGeo = geo[fi];
  const frag = FRAGILITIES.find((f) => f.id === fragilityId);
  const overviewScale = Math.min(1.3, height / 740);
  const cam = frag ? { x: 500, y: 395, s: mobile ? Math.min(1.02, height * .47 / 600) : overviewScale } : focusedGeo ? { x: focusedGeo.end.x, y: focusedGeo.end.y - 12, s: mobile ? 2.15 : Math.min(2.15, height / 320) } : { x: 500, y: 438, s: overviewScale };
  const targetY = mobile && (frag || focusId) ? height * .23 : cy;
  const transform = `translate(${cx}px, ${targetY}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`;

  return (
    <svg
      ref={svgRef}
      data-camera-mode={frag ? "network" : focusId ? "domain" : "overview"}
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Arbre de vie Enfance+"
      onClick={(e) => { if (e.target === e.currentTarget && focusId) onBack(); }}
    >
      <defs>
        <linearGradient id="painted-fade" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".12" stopColor="#fff" /><stop offset=".88" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <mask id="painted-mask"><rect x="-150" y="-40" width="1300" height="872" fill="url(#painted-fade)" /></mask>
        <radialGradient id="painted-vignette" cx="50%" cy="45%" r="70%"><stop offset="55%" stopColor="#060a1a" stopOpacity="0" /><stop offset="100%" stopColor="#060a1a" stopOpacity=".85" /></radialGradient>
        <radialGradient id="aura" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="var(--tree-aura)" stopOpacity="0.4" />
          <stop offset="60%" stopColor="var(--tree-aura)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--tree-aura)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heart" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.38" />
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
        {DOMAINS.map((d) => <linearGradient key={`leaf-${d.id}`} id={`leaf-${d.id}`} x2="1" y2="1"><stop stopColor="var(--bark-mid)" /><stop offset=".48" stopColor={domainColor(d.id)} /><stop offset="1" stopColor="var(--gold)" stopOpacity=".75" /></linearGradient>)}
        {DOMAINS.map((d) => <linearGradient key={d.id} id={`wood-${d.id}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--bark-mid)" />
          <stop offset="58%" stopColor={domainColor(d.id)} stopOpacity="0.38" />
          <stop offset="100%" stopColor={domainColor(d.id)} />
        </linearGradient>)}
      </defs>

      {particles.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.s} className="particle"
          style={{ animationDuration: `${p.d}s`, animationDelay: `${p.delay}s` }} />
      ))}

      <g className="camera" style={{ transform }}>
        {painted && <g pointerEvents="none" data-testid="tree-painted-bg">
          <image href={PAINTED_TREE} x="-150" y="-40" width="1300" height="872" preserveAspectRatio="xMidYMid slice" mask="url(#painted-mask)" />
          <rect x="-150" y="-40" width="1300" height="872" fill="url(#painted-vignette)" />
        </g>}
        {!painted && <>
        <g className="forest-depth" pointerEvents="none" opacity=".24">
          {[70, 170, 860, 960].map((x, i) => <g key={x} transform={`translate(${x},0)`}><path d={`M0 695 Q${i % 2 ? -28 : 28} 420 4 115 M0 430 Q-60 315 -100 285 M5 370 Q70 225 115 190 M0 540 Q-75 410 -140 415`} fill="none" stroke="var(--bark-mid)" strokeWidth="18" /><path d="M0 450 Q-100 315 -155 305 M0 360 Q60 180 130 170" fill="none" stroke="var(--bark-light)" strokeWidth="3" /></g>)}
        </g>
        <path d="M80 718 Q165 625 325 675 Q455 580 500 637 Q570 592 700 680 Q830 622 936 721 L970 790 Q780 770 660 755 Q450 797 285 760 L40 790Z" fill="url(#barkV)" opacity=".7" pointerEvents="none" />
        <ellipse cx="500" cy="330" rx="480" ry="330" fill="url(#aura)" pointerEvents="none" />
        {DOMAINS.map((d, i) => (
          <circle key={d.id} cx={geo[i]?.end.x} cy={geo[i]?.end.y} r="85" fill={domainColor(d.id)} opacity="0.18" filter="url(#soft)" pointerEvents="none" />
        ))}
        <ellipse cx="500" cy="645" rx="380" ry="20" fill="var(--tree-aura)" opacity="0.18" filter="url(#soft)" />

        {/* Racines : contextes */}
        <g className="roots">
          {roots.map((r, i) => (
            <g key={i}>
              <path d={r.body} fill="url(#barkV)" opacity={r.label ? 0.95 : 0.6} />
              <path d={`M${r.end.x},${r.end.y} q${(r.end.x - 500) * 0.13},18 ${(r.end.x - 500) * 0.22},27`} stroke="var(--bark-light)" strokeWidth="2.5" fill="none" pointerEvents="none" />
              <path d={r.spine} stroke="var(--tree-aura)" strokeWidth="0.8" fill="none" opacity="0.5" className="sap" />
              {r.label && !frag && (
                <>
                  <circle cx={r.end.x} cy={r.end.y} r="3" fill="var(--gold)" filter="url(#halo)" />
                  <text x={clampX(r.end.x, r.label.length, mobile ? 19 : 11)} y={r.end.y + 25 + (i % 4 === 2 ? 20 : 0)} textAnchor="middle" className="root-label">{r.label}</text>
                </>
              )}
            </g>
          ))}
        </g>

        {/* Branches */}
        {DOMAINS.map((d: Domain, i) => {
          const g = geo[i];
          if (!g) return null;
          const Icon = DOMAIN_ICONS[i] ?? Sprout;
          const active = focusId === d.id;
          const off = hidden.includes(d.id);
          
          const dim = (focusId && !active) || !!frag;
          const shown = active || (showAllNodes && !focusId && !frag);
          return (
            <g key={d.id} className="branch" style={{ opacity: off ? 0.08 : dim ? 0.29 : 1, pointerEvents: off ? "none" : undefined }}>
              {g.twigs.map((t, k) => <path key={k} d={t} fill={`url(#wood-${d.id})`} />)}
              <path d={g.body} fill={`url(#wood-${d.id})`} />
              <path d={g.body} fill="var(--bark-light)" filter="url(#grain)" />
              <path d={g.spine} stroke={domainColor(d.id)} strokeWidth="10" fill="none" opacity="0.14" filter="url(#soft)" pointerEvents="none" />
              <path d={g.spine} stroke={domainColor(d.id)} strokeWidth="1.4" fill="none" className="sap" filter="url(#halo)" opacity="0.8" />
              <g className="foliage">
                {g.leaves.map((l, k) => (
                  <path key={k} d={LEAF}
                    transform={`translate(${l.x.toFixed(1)},${l.y.toFixed(1)}) rotate(${l.rot.toFixed(0)}) scale(${(l.r / 4.5).toFixed(2)})`}
                    fill={`url(#leaf-${d.id})`}
                    opacity={0.45 + l.tone * 0.4} />
                ))}
              </g>
            </g>
          );
        })}

        {/* Tronc (au premier plan, couvre la base des branches) */}
        <path d={trunk.body} fill="url(#bark)" pointerEvents="none" />
        <path d={trunk.body} fill="var(--bark-light)" filter="url(#grain)" pointerEvents="none" />
        {trunk.veins.map((v, i) => (
          <path key={i} d={v} stroke={i % 3 === 1 ? "var(--tree-aura)" : "var(--bark-dark)"} strokeWidth={i % 3 === 1 ? 0.9 : 1.6}
            fill="none" opacity={i % 3 === 1 ? 0.45 : 0.7} className={i % 3 === 1 ? "sap" : undefined} />
        ))}
        <path d={trunk.spine} stroke="var(--gold)" strokeWidth="20" fill="none" opacity="0.23" filter="url(#soft)" pointerEvents="none" />
        <path d={trunk.spine} stroke="var(--gold)" strokeWidth="1.4" fill="none" className="sap" filter="url(#halo)" />
        </>}
        <ellipse cx="500" cy="470" rx="100" ry="150" fill="url(#heart)" className="core" pointerEvents="none" />

        {DOMAINS.map((d: Domain, i) => {
          const g = geo[i];
          if (!g) return null;
          const Icon = DOMAIN_ICONS[i] ?? Sprout;
          const active = focusId === d.id;
          const off = hidden.includes(d.id);
          const dim = (focusId && !active) || !!frag;
          const shown = active || (showAllNodes && !focusId && !frag);
          return (
            <g key={`top-${d.id}`} className="branch" style={{ opacity: off ? 0.08 : dim ? 0.29 : 1, pointerEvents: off ? "none" : undefined }}>
              <g
                role="button" tabIndex={0} aria-label={`Explorer le domaine ${d.name}`} data-testid={`tree-domain-${d.id}`}
                className="branch-hit"
                onClick={(e) => { e.stopPropagation(); onFocus(d.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(d.id); } }}
              >
                <path d={g.spine} stroke="transparent" strokeWidth="40" fill="none" />
                <circle cx={g.end.x} cy={g.end.y} r="60" fill="transparent" data-domain-target={d.id} />
                <circle cx={g.end.x} cy={g.end.y} r={active ? 4 : 6} fill={domainColor(d.id)} filter="url(#halo)" className="core" />
                {!focusId && <g className="domain-medallion" pointerEvents="none">
                  <circle cx={g.end.x} cy={g.end.y} r="22" fill="var(--background)" fillOpacity="0.85" stroke={domainColor(d.id)} strokeWidth="2" filter="url(#halo)" />
                  <Icon x={g.end.x - 12} y={g.end.y - 12} width="24" height="24" color={domainColor(d.id)} strokeWidth="1.6" />
                </g>}
                {!focusId && (
                  <text x={clampX(g.label.x, (d.name.split(" ")[0] ?? d.name).length, 28)} y={g.label.y} textAnchor="middle" className="branch-label"
                    style={{ fill: domainColor(d.id) }}>{(d.name.split(" ")[0] ?? d.name).toUpperCase()}</text>
                )}
              </g>
              {!focusId && levelLabels[d.id] && <g pointerEvents="none" data-testid={`tree-level-${d.id}`}>
                <rect x={g.end.x - 26} y={g.end.y + 27} width="52" height="17" rx="8.5" fill="var(--background)" fillOpacity=".9" stroke={domainColor(d.id)} strokeWidth=".8" />
                <text x={g.end.x} y={g.end.y + 39} textAnchor="middle" className="level-label">{levelLabels[d.id]}</text>
              </g>}
              {/* Sous-branches révélées au zoom */}
              <g style={{ opacity: shown ? 1 : 0, pointerEvents: shown && !off ? "auto" : "none" }} className={`subnodes ${active ? "" : "subnodes-overview"}`}>
                {d.nodes.map((n, k) => {
                  const side = d.id === "emotionnel" || g.end.x < 500 ? -1 : 1;
                  const p = active ? g.nodes[k] : { x: g.end.x + side * [64, 74, 74, 64][k]!, y: g.end.y - 14 + k * 26 };
                  if (!p) return null;
                  const sel = selectedNode === n.id;
                  const above = p.y < g.end.y;
                  const w = n.label.length * (active ? 5.7 : 6.1) + 14;
                  const h = active ? 18 : 17;
                  const rx = active ? p.x - w / 2 : side > 0 ? p.x + 8 : p.x - 8 - w;
                  const ry = active ? p.y + (above ? -8 - h : 8) : p.y - h / 2;
                  const tx = active ? p.x : rx + w / 2;
                  const ty = active ? p.y + (above ? -8 - h * 0.3 : 8 + h * 0.7) : p.y + 3.6;
                  const link = active ? g.reveal[k] : `M${g.end.x},${g.end.y} Q${(g.end.x + p.x) / 2},${p.y} ${p.x},${p.y}`;
                  return (
                    <g key={n.id} style={{ transition: "opacity .5s, transform .6s", transitionDelay: shown ? `${250 + k * 140}ms` : "0ms", opacity: shown ? 1 : 0, transform: shown ? "none" : `translate(${(g.end.x - p.x) * 0.6}px, ${(g.end.y - p.y) * 0.6}px)` }} role="button" tabIndex={shown ? 0 : -1} aria-label={n.label} className="subnode" data-testid={`tree-node-${n.id}`}
                      onClick={(e) => { e.stopPropagation(); onNode(n.id); }}
                      onKeyDown={(e) => { if (e.key === "Enter") onNode(n.id); }}>
                      <path d={link} stroke={active ? `url(#wood-${d.id})` : domainColor(d.id)} strokeWidth={active ? 2.4 : 1} opacity={active ? 1 : 0.55} fill="none" strokeLinecap="round" pointerEvents="none" />
                      <path d={link} stroke={glow(d.hue, 0.85, 0.15)} strokeWidth="0.5" fill="none" className="sap" pointerEvents="none" />
                      <circle cx={p.x} cy={p.y} r="14" fill="transparent" />
                      <circle cx={p.x} cy={p.y} r={sel ? 5.5 : 4} className={`kind-${n.kind}`} strokeWidth={sel ? 1.2 : 0.6} filter="url(#halo)" />
                      <rect x={rx} y={ry} width={w} height={h} rx={active ? 5 : 8.5}
                        fill="var(--background)" fillOpacity="0.85" stroke={active ? glow(d.hue, 0.8, 0.13) : domainColor(d.id)} strokeWidth={sel ? 0.8 : active ? 0.35 : 0.6} />
                      <text x={tx} y={ty} textAnchor="middle" className="sub-label">{n.label}</text>
                    </g>
                  );
                })}
              </g>
            </g>
          );
        })}
        {painted ? null : avatar.portrait ? (
          <g pointerEvents="none" opacity={focusId || frag ? .3 : 1} data-testid="tree-portrait">
            <defs><clipPath id="portrait-clip"><circle cx="500" cy="506" r="56" /></clipPath></defs>
            <circle cx="500" cy="506" r="63" fill="none" stroke="var(--gold)" strokeWidth="1.2" opacity=".5" filter="url(#halo)" />
            <image href={portraitSrc(avatar.portrait) ?? ""} x="444" y="450" width="112" height="112" clipPath="url(#portrait-clip)" preserveAspectRatio="xMidYMid slice" />
            <circle cx="500" cy="506" r="56" fill="none" stroke="var(--gold)" strokeWidth="2.2" />
          </g>
        ) : <svg x="444" y="455" width="112" height="146" pointerEvents="none" opacity={focusId || frag ? .3 : 1}><AvatarIllustration options={avatar} /></svg>}
        {focusId === "emotionnel" && !frag && <g className="subnode anxiety-discovery" role="button" tabIndex={0} aria-label="Fragilité : Anxiété" onClick={(e) => { e.stopPropagation(); onFragility?.("f-anxiete"); }} onKeyDown={(e) => { if (e.key === "Enter") onFragility?.("f-anxiete"); }}>
          <path d={`M${focusedGeo?.end.x ?? 500},${focusedGeo?.end.y ?? 185} Q610,195 650,210`} stroke="var(--fragility)" strokeWidth="1" fill="none" className="sap" pointerEvents="none" />
          <rect x="625" y="195" width="95" height="29" rx="8" fill="var(--background)" stroke="var(--fragility)" /><AlertTriangle x="632" y="202" width="15" height="15" color="var(--fragility)" pointerEvents="none" /><text x="654" y="214" className="discovery-label" pointerEvents="none">Anxiété</text>
        </g>}
        {/* Défis et fragilités : nœuds distincts (losanges), liens = relations possibles */}
        {frag && onFactor && <FactorNetwork fragilityId={frag.id} selectedFactor={selectedFactor ?? null} onFactor={onFactor} />}
        {!focusId && !frag && <text x="500" y="590" textAnchor="middle" className="challenge-title">DÉFIS ET FRAGILITÉS ÉVOLUTIVES</text>}
        <g style={{ pointerEvents: focusId ? "none" : "auto", opacity: focusId ? 0.25 : 1, transition: "opacity .6s" }}>
          {FRAGILITIES.map((f, i) => {
            const p = FRAG_POS[i]; if (!p) return null; const FragIcon = FRAG_ICONS[i] ?? AlertTriangle; const sel = f.id === fragilityId;
            const short = f.label.replace("Difficultés de concentration", "Concentration").replace("Régulation émotionnelle", "Régulation");
            return (
              <g key={f.id} role="button" tabIndex={focusId ? -1 : 0} aria-label={`Fragilité : ${f.label}`} className="frag-node" data-testid={`tree-frag-${f.id}`}
                style={{ opacity: frag && !sel ? 0.45 : 1 }}
                onClick={(e) => { e.stopPropagation(); onFragility?.(f.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFragility?.(f.id); } }}>
                <circle cx={p.x} cy={p.y} r="22" fill="transparent" />
                <rect x={p.x - 7} y={p.y - 7} width="14" height="14" transform={`rotate(45 ${p.x} ${p.y})`}
                  fill="var(--background)" stroke="var(--fragility)" strokeWidth={sel ? 2 : 1.2} filter="url(#halo)" />
                <circle cx={p.x} cy={p.y} r="17" fill="var(--background)" stroke="var(--fragility)" strokeWidth={sel ? 2.5 : 1} filter="url(#halo)" />
                <FragIcon x={p.x - 10} y={p.y - 10} width="20" height="20" color="var(--fragility)" />
                <text x={p.x} y={p.y + 32} textAnchor="middle" className="frag-label">{short.replace("Gestion des conflits", "Conflits")}</text>
              </g>
            );
          })}
        </g>
      </g>
    </svg>
  );
}
