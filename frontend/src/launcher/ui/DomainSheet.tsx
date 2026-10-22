import { ArrowLeft } from "lucide-react";
import type { LDomain } from "../data/launcher";
import { DEMO_PROFILE } from "../data/launcher";
import { Section, Sheet } from "./Sheet";

interface Props { domain: LDomain; subId: string | null; onSub: (id: string) => void; onBack: () => void }

export function DomainSheet({ domain, subId, onSub, onBack }: Props) {
  return (
    <Sheet key={domain.id} eyebrow="Domaine" title={domain.name} accent={domain.palette.main} onClose={onBack} testid="domain-sheet">
      <p className="lx-intro">{domain.intro}</p>
      <Section title="Sous-branches">
        <ul className="lx-subs">
          {domain.subs.map((s, i) => (
            <li key={s.id} className="lx-stagger" style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
              <button className={`lx-sub ${subId === s.id ? "is-on" : ""}`} onClick={() => onSub(s.id)} data-testid={`domain-sub-${s.id}`}>
                <span className="lx-sub-dot" />
                <span><b>{s.label}</b><small>{s.note}</small></span>
              </button>
            </li>
          ))}
        </ul>
      </Section>
      <Section title={`Dans le profil fictif de ${DEMO_PROFILE.name}`}>
        <p className="lx-quote" data-testid="domain-demo-observation">{domain.observation}</p>
      </Section>
      <button className="lx-btn lx-btn-ghost w-full" onClick={onBack} data-testid="back-to-overview-button"><ArrowLeft size={16} /> Revenir à la vue générale</button>
    </Sheet>
  );
}
