import { Users, Handshake, BookOpen, Moon, Compass, ShieldCheck, Sprout } from "lucide-react";
import type { Domain } from "@/data/domains";
import { FACTORS } from "@/data/factors";
import { FRAGILITIES } from "@/data/fragilities";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";

const ICONS: Record<string, typeof Users> = { famille: Users, relations: Handshake, ecole: BookOpen, repos: Moon, evenements: Compass, protection: ShieldCheck };
const POS = [{ x: 72, y: 24 }, { x: 228, y: 24 }, { x: 72, y: 104 }, { x: 228, y: 104 }, { x: 150, y: 146 }];

export function FactorMini({ domain, onFactor }: { domain: Domain; onFactor: (id: string) => void }) {
  const fragIds = FRAGILITIES.filter((f) => f.domains.includes(domain.id)).map((f) => f.id);
  const factors = FACTORS.filter((f) => f.domainId === domain.id || f.fragilities.some((x) => fragIds.includes(x))).slice(0, 5);
  const C = DOMAIN_ICON[domain.id] ?? Sprout;
  return (
    <svg viewBox="0 0 300 182" className="w-full" data-testid="factor-mini-network">
      {factors.map((f, i) => {
        const p = POS[i]!;
        return <line key={f.id} x1="150" y1="72" x2={p.x} y2={p.y} stroke={domainColor(f.domainId)} strokeWidth="1.5" opacity=".7" className="sap" />;
      })}
      <circle cx="150" cy="72" r="22" fill="var(--background)" stroke={domainColor(domain.id)} strokeWidth="2" filter="drop-shadow(0 0 8px rgba(251,191,36,.6))" />
      <C x={138} y={60} width={24} height={24} color={domainColor(domain.id)} />
      {factors.map((f, i) => {
        const p = POS[i]!; const I = ICONS[f.id] ?? ShieldCheck;
        return (
          <g key={f.id} role="button" tabIndex={0} className="factor-hit" onClick={() => onFactor(f.id)} onKeyDown={(e) => e.key === "Enter" && onFactor(f.id)} data-testid={`factor-mini-${f.id}`}>
            <circle cx={p.x} cy={p.y} r="14" fill="var(--background)" stroke={domainColor(f.domainId)} strokeWidth="1.8" />
            <I x={p.x - 8} y={p.y - 8} width={16} height={16} color={domainColor(f.domainId)} />
            <text x={p.x} y={p.y + 27} textAnchor="middle" className="mini-label">{f.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
