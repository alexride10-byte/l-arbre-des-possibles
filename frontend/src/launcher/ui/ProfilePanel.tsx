import { Check } from "lucide-react";
import { PORTRAITS } from "@/lib/assets";
import { DEMO_PROFILE } from "../data/launcher";
import { Section, Sheet } from "./Sheet";

interface Props { avatar: string; onAvatar: (id: string) => void; onClose: () => void }

export function ProfilePanel({ avatar, onAvatar, onClose }: Props) {
  const current = PORTRAITS.find((p) => p.id === avatar) ?? PORTRAITS[0];
  return (
    <Sheet eyebrow="Profil fictif" title={DEMO_PROFILE.name} onClose={onClose} testid="profile-panel" side="left">
      <div className="lx-profile-head">
        <img src={current.url} alt={`Avatar de ${DEMO_PROFILE.name}`} className="lx-profile-avatar" data-testid="profile-avatar" />
        <div>
          <p className="lx-profile-age" data-testid="profile-age">{DEMO_PROFILE.age}</p>
          <p className="lx-badge">{DEMO_PROFILE.note}</p>
        </div>
      </div>
      <Section title="Changer l'avatar">
        <div className="lx-avatars">
          {PORTRAITS.map((p) => (
            <button key={p.id} className={`lx-avatar-opt ${p.id === avatar ? "is-on" : ""}`} onClick={() => onAvatar(p.id)} aria-label={p.label} title={p.label} data-testid={`avatar-option-${p.id}`}>
              <img src={p.url} alt="" />{p.id === avatar && <span><Check size={12} /></span>}
            </button>
          ))}
        </div>
      </Section>
      <Section title="Capacités">
        <div className="lx-chips">{DEMO_PROFILE.capacities.map((c) => <span key={c} className="lx-chip lx-chip-static" style={{ "--c": "#f5c46a" } as React.CSSProperties}><span className="lx-chip-dot" />{c}</span>)}</div>
      </Section>
      <Section title="Observations fictives">
        <ul className="lx-obs">{DEMO_PROFILE.observations.map((o) => <li key={o.text}><time>{o.date}</time>{o.text}</li>)}</ul>
      </Section>
      <Section title="Objectifs d'accompagnement">
        <ul className="lx-list">{DEMO_PROFILE.goals.map((g) => <li key={g}>{g}</li>)}</ul>
      </Section>
    </Sheet>
  );
}
