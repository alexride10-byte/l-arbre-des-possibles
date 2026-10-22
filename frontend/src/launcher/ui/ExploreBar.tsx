import { ArrowLeft, UserRound } from "lucide-react";
import { LogoMark } from "./HomeOverlay";

interface Props { domainName?: string; avatar?: string; onHome: () => void; onBack?: () => void; onProfile: () => void }

export function ExploreBar({ domainName, avatar, onHome, onBack, onProfile }: Props) {
  return (
    <header className="lx-bar" data-testid="explore-bar">
      <button className="lx-bar-brand" onClick={onHome} aria-label="Retour à l'accueil" data-testid="explore-home-button">
        <LogoMark size={30} /><span>Enfance<b>+</b></span>
      </button>
      <nav className="lx-crumbs" aria-label="Fil d'Ariane">
        <button onClick={onBack} disabled={!onBack} data-testid="crumb-tree">Arbre</button>
        {domainName && <><span>/</span><b data-testid="crumb-domain">{domainName}</b></>}
      </nav>
      <div className="lx-bar-right">
        {onBack && <button className="lx-btn lx-btn-ghost lx-btn-sm" onClick={onBack} data-testid="bar-back-button"><ArrowLeft size={15} /><span className="hidden sm:inline">Vue générale</span></button>}
        <button className="lx-btn lx-btn-ghost lx-btn-sm" onClick={onProfile} data-testid="bar-profile-button">
          {avatar ? <img src={avatar} alt="" className="lx-bar-avatar" /> : <UserRound size={15} />}<span className="hidden sm:inline">Profil fictif</span>
        </button>
      </div>
    </header>
  );
}

export function ExploreHint() {
  return (
    <div className="lx-hint" data-testid="explore-hint">
      <p>Touchez une branche pour zoomer · Touchez un nœud pour voir ses liens</p>
      <div className="lx-legend">
        <span><i className="lx-lg-cap" />Capacités et ressources</span>
        <span><i className="lx-lg-frag" />Défis et fragilités évolutives</span>
        <span><i className="lx-lg-root" />Racines : contexte</span>
      </div>
    </div>
  );
}
