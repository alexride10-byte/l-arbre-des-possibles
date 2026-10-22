import { TREE } from "./geometry";

interface Props { fs: number; labels: boolean; focusId: string | null; linked: Set<string>; dimAll: boolean; onNode: (id: string) => void }

const groups = [
  { list: TREE.capacities, kind: "capacity", title: "Capacités et ressources", tx: 452, anchor: "end" as const, dir: -1 },
  { list: TREE.fragilities, kind: "fragility", title: "Défis et fragilités évolutives", tx: 548, anchor: "start" as const, dir: 1 },
];

export function NodeLayer({ fs, labels, focusId, linked, dimAll, onNode }: Props) {
  return (
    <g data-testid="tree-nodes">
      {groups.map((g, gi) => (
        <g key={g.kind}>
          {labels && <text x={g.tx} y={556} textAnchor={g.anchor} fontSize={fs * 0.72} className={`svg-label node-caption node-caption-${g.kind} node-in`} style={{ animationDelay: `${3 + gi * 0.1}s` }}>{g.title.toUpperCase()}</text>}
          {g.list.map(({ n, p }, k) => {
            const state = focusId === n.id ? "is-focus" : linked.has(n.id) ? "is-linked" : dimAll ? "is-dim" : "";
            return (
              <g key={n.id} className={`tnode tnode-${g.kind} ${state}`} onClick={() => onNode(n.id)} role="button" tabIndex={0} aria-label={n.label}
                onKeyDown={(e) => e.key === "Enter" && onNode(n.id)} data-testid={`tree-node-${n.id}`}>
                <g className="node-in" style={{ animationDelay: `${3 + gi * 0.2 + k * 0.08}s` }}>
                  <circle cx={p.x} cy={p.y} r="16" fill={g.kind === "capacity" ? "url(#capGlow)" : "url(#fragGlow)"} className="tnode-glow" />
                  <circle cx={p.x} cy={p.y} r="4.6" fill={g.kind === "capacity" ? "#ffe9a8" : "#ffc2cc"} />
                  <circle cx={p.x} cy={p.y} r="8.5" fill="none" stroke={g.kind === "capacity" ? "#f5c46a" : "#f59aac"} strokeWidth="1" strokeDasharray={g.kind === "fragility" ? "2.5 2.5" : undefined} className="tnode-ring" />
                  <circle cx={p.x} cy={p.y} r="20" fill="transparent" />
                  {labels && <text x={p.x + g.dir * 15} y={p.y + fs * 0.32} textAnchor={g.anchor} fontSize={fs * 0.86} className="svg-label tnode-label">{n.label}</text>}
                </g>
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}
