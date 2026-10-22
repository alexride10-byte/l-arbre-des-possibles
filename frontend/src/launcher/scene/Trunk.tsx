import { TREE, TRUNK, TRUNK_CORE, GROUND_Y, curvePath, taper } from "./geometry";

const BARK = ["M489 792 C491 720 493 640 495 540", "M511 792 C509 700 507 620 505 540", "M468 800 C477 762 481 722 484 680", "M532 800 C523 762 519 722 516 680"];

interface Props { fs: number; labels: boolean; focusId: string | null; linked: Set<string>; dimAll: boolean; avatar?: string; onRoot: (id: string) => void; onAvatar: () => void }

export function Trunk({ fs, labels, focusId, linked, dimAll, avatar, onRoot, onAvatar }: Props) {
  return (
    <g data-testid="tree-trunk">
      <rect x="-600" y={GROUND_Y} width="2200" height="400" fill="url(#soil)" />
      <ellipse cx="500" cy={GROUND_Y} rx="430" ry="30" fill="url(#groundGlow)" />
      <circle cx="500" cy={GROUND_Y - 6} r="150" fill="url(#rootLight)" className="root-light" />
      <path d="M90 808 C230 796 360 800 500 804 C640 800 770 796 910 808" stroke="#8fa0ff" strokeOpacity=".25" strokeWidth="1.2" fill="none" className="draw" pathLength={1} style={{ animationDelay: ".2s", animationDuration: "1.6s" }} />
      {TREE.roots.map(({ r, tip, curve }, k) => {
        const state = focusId === r.id ? "is-focus" : linked.has(r.id) ? "is-linked" : dimAll ? "is-dim" : "";
        return (
          <g key={r.id} className={`root ${state}`} onClick={() => onRoot(r.id)} role="button" tabIndex={0} aria-label={r.label} data-testid={`tree-root-${r.id}`}
            onKeyDown={(e) => e.key === "Enter" && onRoot(r.id)}>
            <path d={taper(curve, 20, 2.5)} fill="url(#rootGrad)" className="grow-fade" style={{ animationDelay: `${0.3 + k * 0.08}s` }} />
            <path d={curvePath(curve)} stroke="#f5c46a" strokeWidth="1.6" strokeOpacity=".75" fill="none" pathLength={1} className="draw root-vein" style={{ animationDelay: `${0.25 + k * 0.1}s` }} />
            <circle cx={tip.x} cy={tip.y} r="4" fill="#ffd98a" className="node-in root-tip" style={{ animationDelay: `${1.1 + k * 0.08}s` }} />
            <path d={curvePath(curve)} stroke="transparent" strokeWidth="24" fill="none" />
            <circle cx={tip.x} cy={tip.y} r="34" fill="transparent" />
            {labels && <text x={tip.x} y={tip.y + fs * 1.6} textAnchor="middle" fontSize={fs * 0.95} className="svg-label root-label node-in" style={{ animationDelay: `${3.2 + k * 0.06}s` }}>{r.label}</text>}
          </g>
        );
      })}
      {labels && <text x="500" y={990 + fs * 0.6} textAnchor="middle" fontSize={fs * 0.78} className="svg-label root-caption node-in" style={{ animationDelay: "3.6s" }}>Racines · facteurs de contexte à explorer</text>}
      <mask id="m-trunk" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
        <rect x="400" y="480" width="200" height="340" fill="#fff" className="rise" />
      </mask>
      <g mask="url(#m-trunk)">
        <path d={TRUNK} fill="url(#trunkBark)" />
        {BARK.map((d) => <path key={d} d={d} stroke="#0d0919" strokeOpacity=".55" strokeWidth="2" fill="none" />)}
        <path d={TRUNK_CORE} stroke="url(#coreGlow)" strokeWidth="9" fill="none" filter="url(#soft)" className="core-glow" />
        <path d={TRUNK_CORE} stroke="#ffe3a0" strokeOpacity=".55" strokeWidth="1.5" fill="none" />
      </g>
      {avatar && (
        <g transform={`translate(268 ${GROUND_Y - 8})`} className="tree-avatar node-in" style={{ animationDelay: "3.4s" }} onClick={onAvatar} role="button" tabIndex={0} aria-label="Profil fictif" data-testid="tree-avatar">
          <circle r="36" fill="url(#capGlow)" opacity=".5" />
          <image href={avatar} x="-27" y="-27" width="54" height="54" clipPath="url(#avatarClip)" preserveAspectRatio="xMidYMid slice" />
          <circle r="27.5" fill="none" stroke="#f5c46a" strokeWidth="1.6" />
        </g>
      )}
    </g>
  );
}
