import { useEffect, useMemo, useRef, useState } from "react";
import { Defs } from "./Defs";
import { Trunk } from "./Trunk";
import { DomainBranch, type DomainState } from "./DomainBranch";
import { NodeLayer } from "./NodeLayer";
import { LinkLayer } from "./LinkLayer";
import { TREE } from "./geometry";
import { cameraFor, isWide, type View } from "./camera";
import { linksFor } from "../logic/links";

interface Props {
  view: View; domainId: string | null; focusId: string | null; subId: string | null; avatar?: string; labels: boolean;
  onDomain: (id: string) => void; onNode: (id: string) => void; onSub: (id: string) => void; onAvatar: () => void;
}

function useSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export function TreeScene({ view, domainId, focusId, subId, avatar, labels, onDomain, onNode, onSub, onAvatar }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(ref);
  const dom = TREE.domains.find((d) => d.d.id === domainId);
  const cam = cameraFor(dom ? "domain" : view, w, h, dom?.canopy);
  const sBase = cameraFor("overview", w, h).s;
  const fs = Math.max(13, (isWide(w) ? 12.5 : 10) / sBase);
  const subFs = (isWide(w) ? 14 : 11.5) / (dom ? cam.s : 1);
  const linked = useMemo(() => new Set(focusId ? linksFor(focusId).map((l) => l.id) : []), [focusId]);
  const stateOf = (id: string): DomainState => domainId ? (id === domainId ? "selected" : "dim") : focusId ? (linked.has(id) ? "linked" : "dim") : "idle";
  const dimNodes = !!domainId || !!focusId;

  return (
    <div ref={ref} className={`tree-stage view-${view}`} data-testid="tree-scene" data-view={dom ? "domain" : view}>
      <svg width="100%" height="100%" className="tree-svg" role="img" aria-label="Arbre de vie Enfance+">
        <Defs />
        <g className="camera" style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.s})` }} data-testid="tree-camera">
          <Trunk fs={fs} labels={labels} focusId={focusId} linked={linked} dimAll={dimNodes} avatar={avatar} onRoot={onNode} onAvatar={onAvatar} />
          {TREE.domains.map((t, i) => (
            <DomainBranch key={t.d.id} t={t} idx={i} state={stateOf(t.d.id)} fs={fs} subFs={subFs} labels={labels} wrap={!isWide(w)} subId={subId} onDomain={onDomain} onSub={onSub} />
          ))}
          <NodeLayer fs={fs} labels={labels} focusId={focusId} linked={linked} dimAll={dimNodes} onNode={onNode} />
          {focusId && <LinkLayer key={focusId} id={focusId} />}
        </g>
      </svg>
    </div>
  );
}
