import { History, Sparkles, UserRound } from "lucide-react";

export const LogoMark = ({ size = 40 }: { size?: number }) => (
  <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className="lx-mark">
    <defs><linearGradient id="lx-logo" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#f59e0b" /><stop offset="1" stopColor="#fde68a" /></linearGradient></defs>
    <path d="M20 34 C12 28 6 22 8 12 C14 14 18 19 20 26 C22 19 26 14 32 12 C34 22 28 28 20 34Z" fill="url(#lx-logo)" opacity=".9" />
    <path d="M20 30 C17 22 17 13 20 5 C23 13 23 22 20 30Z" fill="#fde68a" />
    <path d="M20 34 V38 M14 37 H26" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

interface Props { canResume: boolean; onExplore: () => void; onResume: () => void; onProfile: () => void }

export function HomeOverlay({ canResume, onExplore, onResume, onProfile }: Props) {
  return (
    <section className="lx-home" data-testid="launcher-home">
      <div className="lx-home-brand">
        <div className="lx-reveal" style={{ animationDelay: ".2s" }}><LogoMark size={52} /></div>
        <h1 className="lx-title lx-reveal" style={{ animationDelay: ".35s" }} data-testid="launcher-title">Enfance<span>+</span></h1>
        <p className="lx-sign lx-reveal" style={{ animationDelay: ".55s" }} data-testid="launcher-signature">Comprendre · Agir · Grandir</p>
        <p className="lx-lead lx-reveal" style={{ animationDelay: ".75s" }}>Explorez l'arbre des capacités et du développement de l'enfant, branche par branche.</p>
      </div>
      <div className="lx-home-actions lx-reveal" style={{ animationDelay: "1s" }}>
        <button className="lx-btn lx-btn-primary" onClick={onExplore} data-testid="explore-tree-button"><Sparkles size={18} /> Explorer l'arbre</button>
        {canResume && <button className="lx-btn lx-btn-ghost" onClick={onResume} data-testid="resume-exploration-button"><History size={17} /> Reprendre l'exploration</button>}
        <button className="lx-btn lx-btn-ghost" onClick={onProfile} data-testid="demo-profile-button"><UserRound size={17} /> Profil fictif</button>
        <a href="/connexion" className="lx-login" data-testid="pro-login-link">Espace professionnel · Se connecter</a>
      </div>
    </section>
  );
}
