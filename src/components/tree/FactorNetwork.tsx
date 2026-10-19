import { FACTORS, factorsFor } from "@/data/factors";
import { Users, Handshake, BookOpen, Moon, Compass, ShieldCheck } from "lucide-react";

const POSITIONS = [{ x: 235, y: 190 }, { x: 760, y: 190 }, { x: 245, y: 365 }, { x: 765, y: 365 }, { x: 235, y: 525 }, { x: 770, y: 525 }];
const ICONS = [Users, Handshake, BookOpen, Moon, Compass, ShieldCheck];
export function FactorNetwork({ fragilityId, selectedFactor, onFactor }: { fragilityId: string; selectedFactor?: string | null; onFactor: (id: string) => void }) {
  const factors = factorsFor(fragilityId);
  return <g className="factor-network">
    {factors.map((f) => {
      const i = FACTORS.findIndex((x) => x.id === f.id);
      const p = POSITIONS[i]; if (!p) return null;
      const Icon = ICONS[i] ?? ShieldCheck;
      const color = `var(--domain-${f.domainId})`;
      const left = p.x < 500;
      return <g key={f.id}>
        <path d={`M500,605 C${left ? 405 : 595},${p.y + 100} ${left ? p.x + 45 : p.x - 45},${p.y + 80} ${p.x},${p.y}`} fill="none" stroke={color} strokeWidth="2" strokeDasharray="4 7" className="dash-flow" pointerEvents="none" />
        <g role="button" tabIndex={0} aria-label={`Facteur : ${f.label}`} className="factor-hit" onClick={(e) => { e.stopPropagation(); onFactor(f.id); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFactor(f.id); } }}>
          <rect x={p.x - 130} y={p.y - 25} width="260" height="74" rx="8" fill="var(--background)" fillOpacity="0.94" stroke={color} strokeWidth={selectedFactor === f.id ? 3 : 1.5} />
          <Icon x={p.x - 12} y={p.y - 16} width="24" height="24" color={color} />
          <text x={p.x} y={p.y + 31} textAnchor="middle" className="factor-label">{f.label}</text>
        </g>
      </g>;
    })}
    <circle cx="500" cy="605" r="15" fill="var(--background)" stroke="var(--fragility)" strokeWidth="2" filter="url(#halo)" />
  </g>;
}