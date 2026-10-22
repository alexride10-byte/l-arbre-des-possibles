import { CANOPY_R, curvePath, taper, type Leaf, type TreeDomain } from "./geometry";

export type DomainState = "idle" | "selected" | "dim" | "linked";

export interface Props {
  t: TreeDomain; idx: number; state: DomainState; fs: number; subFs: number; labels: boolean; wrap: boolean;
  subId: string | null; onDomain: (id: string) => void; onSub: (id: string) => void;
}

const Leaves = ({ items, cls }: { items: Leaf[]; cls: string }) => (
  <>{items.map((l, i) => (
    <g key={i} transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.r.toFixed(0)}) scale(${l.s.toFixed(2)})`}>
      <use href="#leaf" fill={l.fill} opacity={l.o} className={cls} style={{ animationDelay: `${l.d.toFixed(2)}s` }} />
    </g>
  ))}</>
);

function anchor(angle: number) {
  const c = Math.cos((angle * Math.PI) / 180);
  return c > 0.35 ? "start" : c < -0.35 ? "end" : "middle";
}

export function SubOrbs({ t, subFs, wrap, subId, onSub }: Pick<Props, "t" | "subFs" | "wrap" | "subId" | "onSub">) {
  return (
    <g>
      {t.twigs.map((tw, k) => {
        const a = (tw.angle * Math.PI) / 180, lx = tw.tip.x + Math.cos(a) * 13, ly = tw.tip.y - Math.sin(a) * 13 + subFs * 0.35;
        const words = tw.sub.label.split(" "), half = Math.ceil(words.length / 2);
        const lines = wrap && words.length > 1 ? [words.slice(0, half).join(" "), words.slice(half).join(" ")] : [tw.sub.label];
        const on = subId === tw.sub.id;
        return (
          <g key={tw.sub.id} className={`orb orb-in ${on ? "is-on" : ""}`} style={{ animationDelay: `${0.55 + k * 0.12}s` }}
            onClick={(e) => { e.stopPropagation(); onSub(tw.sub.id); }} role="button" tabIndex={0} aria-label={tw.sub.label} data-testid={`tree-sub-${tw.sub.id}`}
            onKeyDown={(e) => e.key === "Enter" && onSub(tw.sub.id)}>
            <circle cx={tw.tip.x} cy={tw.tip.y} r={on ? 17 : 13} fill={`url(#glow-${t.d.id})`} />
            <circle cx={tw.tip.x} cy={tw.tip.y} r={on ? 5.5 : 4.2} fill={t.d.palette.light} stroke="#fff" strokeOpacity=".7" strokeWidth=".6" />
            {on && <circle cx={tw.tip.x} cy={tw.tip.y} r="9" fill="none" stroke={t.d.palette.light} strokeWidth=".8" className="orb-ring" />}
            <text x={lx} y={ly - (lines.length - 1) * subFs * 0.5} textAnchor={anchor(tw.angle)} fontSize={subFs} className={`svg-label sub-label ${on ? "is-on" : ""}`}>
              {lines.map((l, i) => <tspan key={i} x={lx} dy={i ? subFs * 1.1 : 0}>{l}</tspan>)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function DomainBranch({ t, idx, state, fs, labels, onDomain }: Omit<Props, "subFs" | "wrap" | "subId" | "onSub">) {
  const { d, curve, offshoots, canopy, label, twigs } = t;
  const delay = 1.3 + idx * 0.09;
  const selected = state === "selected";
  return (
    <g className={`dom dom-${state}`} data-testid={`tree-domain-${d.id}`}>
      <circle cx={canopy.x} cy={canopy.y} r={CANOPY_R * 1.55} fill={`url(#glow-${d.id})`} className="dom-glow" style={{ animationDelay: `${delay + 0.9}s` }} />
      <mask id={`m-${d.id}`} maskUnits="userSpaceOnUse" x="-200" y="-200" width="1400" height="1400">
        {[curve, ...offshoots].map((c, k) => (
          <path key={k} d={curvePath(c)} stroke="#fff" strokeWidth={k ? 30 : 64} strokeLinecap="round" fill="none" pathLength={1} className="draw" style={{ animationDelay: `${delay + k * 0.3}s` }} />
        ))}
      </mask>
      <g mask={`url(#m-${d.id})`}>
        <path d={taper(curve, 27, 5)} fill="url(#bark)" />
        <path d={taper(curve, 7, 1)} fill={d.palette.light} opacity=".28" />
        {offshoots.map((o, k) => <path key={k} d={taper(o, 10, 1.5)} fill="url(#bark)" />)}
      </g>
      <g className="sway" style={{ transformOrigin: `${curve.p0.x}px ${curve.p0.y}px`, animationDelay: `-${idx * 1.7}s` }}>
        {twigs.map((tw, k) => <path key={tw.sub.id} d={curvePath(tw.curve)} stroke={d.palette.deep} strokeOpacity=".7" strokeWidth="2.2" strokeLinecap="round" fill="none" pathLength={1} className="draw" style={{ animationDelay: `${delay + 0.7 + k * 0.05}s` }} />)}
        <Leaves items={t.leaves} cls="leaf-pop" />
        {selected && (
          <g key={`detail-${d.id}`} className="dom-detail">
            {twigs.map((tw, k) => (
              <path key={tw.sub.id} d={curvePath(tw.curve)} stroke={d.palette.light} strokeWidth="1.3" strokeLinecap="round" fill="none" pathLength={1} className="draw twig-light" style={{ animationDelay: `${0.35 + k * 0.1}s` }} />
            ))}
            <Leaves items={t.detail} cls="leaf-pop" />
          </g>
        )}
      </g>
      {!selected && (
        <circle cx={canopy.x} cy={canopy.y} r={CANOPY_R + 12} fill="transparent" className="dom-hit" onClick={() => onDomain(d.id)} role="button" tabIndex={0}
          aria-label={`Explorer le domaine ${d.name}`} onKeyDown={(e) => e.key === "Enter" && onDomain(d.id)} data-testid={`tree-domain-hit-${d.id}`} />
      )}
      {labels && (
        <text x={label.x + (label.x > 850 ? 60 : label.x < 150 ? -60 : 0)} y={label.y + fs * 0.35} textAnchor={label.x > 850 ? "end" : label.x < 150 ? "start" : "middle"} fontSize={fs * 1.3} fill={d.palette.light} className="svg-label dom-label node-in" style={{ animationDelay: `${delay + 2}s` }}
          onClick={() => onDomain(d.id)} data-testid={`tree-domain-label-${d.id}`}>{d.name}</text>
      )}
    </g>
  );
}
