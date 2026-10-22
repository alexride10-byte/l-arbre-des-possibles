import { anchorOf, linkPath } from "./geometry";
import { linksFor } from "../logic/links";

export function LinkLayer({ id }: { id: string }) {
  const from = anchorOf(id);
  if (!from) return null;
  return (
    <g className="links" data-testid="tree-links">
      {linksFor(id).map((l, k) => {
        const to = anchorOf(l.id);
        if (!to) return null;
        const d = linkPath(from, to);
        return (
          <g key={l.id} data-testid={`tree-link-${l.id}`}>
            <path d={d} stroke={l.color} strokeOpacity=".25" strokeWidth="6" fill="none" filter="url(#soft)" />
            <path d={d} stroke={l.color} strokeWidth="1.6" fill="none" pathLength={1} className="draw" style={{ animationDelay: `${k * 0.09}s`, animationDuration: ".9s" }} />
            <path d={d} stroke="#fff" strokeOpacity=".8" strokeWidth="1.1" fill="none" strokeDasharray="3 14" className="link-flow" />
            <circle cx={to.x} cy={to.y} r="12" fill="none" stroke={l.color} strokeWidth="1.4" className="link-pulse" style={{ animationDelay: `${0.4 + k * 0.09}s` }} />
          </g>
        );
      })}
      <circle cx={from.x} cy={from.y} r="14" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.2" className="link-pulse" />
    </g>
  );
}
