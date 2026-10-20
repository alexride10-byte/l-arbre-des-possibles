import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Sprout, Gem, AlertTriangle, Workflow, Trees, FileText, UsersRound, Network, Clock, Clock4, GitCompare, Pencil } from "lucide-react";
import { useApp, type Mode } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { xpLevel } from "@/lib/rpg";
import { AvatarIllustration } from "./AvatarIllustration";

export function LeftSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const app = useApp();
  const { child, profiles, selectChild, hidden, toggleDomain, mode, setMode, resetView, openFrag, openDomain, back } = app;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!child) return null;
  const go = (to: string, then?: () => void) => { navigate(to); then?.(); onNavigate?.(); };
  const lvl = xpLevel(child.xp);
  const links = [
    ["Vue globale", LayoutDashboard, () => go("/", back), pathname === "/"],
    ["Développement", Sprout, () => go("/arbre"), pathname === "/arbre"],
    ["Compétences", Gem, () => go("/competences"), pathname === "/competences"],
    ["Défis et fragilités", AlertTriangle, () => go("/", () => openFrag("f-anxiete")), false],
    ["Interventions", Workflow, () => go("/interventions"), pathname === "/interventions"],
    ["Environnement", Trees, () => go("/", () => openDomain("environnement")), false],
    ["Documents", FileText, () => go("/documents"), pathname === "/documents"],
    ["Personnes ressources", UsersRound, () => go("/ressources"), pathname === "/ressources"],
  ] as const;
  const views: [string, typeof Network, () => void, boolean][] = [
    ["Arbre", Network, () => go("/", () => setMode("actuelle")), mode === "actuelle" && pathname === "/"],
    ["Chronologie", Clock, () => go("/chronologie"), pathname === "/chronologie"],
    ["Simulation future", Clock4, () => go("/", () => setMode("simulation" as Mode)), mode === "simulation"],
    ["Comparaison", GitCompare, () => go("/", () => setMode("comparaison" as Mode)), mode === "comparaison"],
  ];
  return (
    <aside className="panel flex h-full flex-col gap-4 overflow-y-auto p-4" data-testid="left-sidebar">
      <div className="profile-portrait relative">
        <AvatarIllustration options={child.avatar} className="h-full w-full" />
        <button onClick={() => go("/profil")} className="icon-btn absolute right-2 top-2 h-8 w-8" aria-label="Modifier le profil" data-testid="sidebar-edit-profile"><Pencil size={14} /></button>
      </div>
      <div>
        <p className="font-display text-2xl font-semibold" data-testid="sidebar-child-name">{child.name}</p>
        <p className="text-xs text-muted-foreground">{child.age} ans{child.grade && ` • ${child.grade}`}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="pill-green" data-testid="sidebar-profile-active">● Profil actif</span>
          {child.owner_name && <span className="pill-muted" data-testid="sidebar-shared-by">Partagé par {child.owner_name}</span>}
          <span className="pill-muted" data-testid="sidebar-xp-level">Niv. {lvl.level} · {child.xp} XP</span>
        </div>
        {profiles.length > 1 && (
          <select value={child.child_id} onChange={(e) => selectChild(e.target.value)} className="field mt-3" data-testid="sidebar-child-switcher" aria-label="Changer de profil">
            {profiles.map((p) => <option key={p.child_id} value={p.child_id}>{p.name}</option>)}
          </select>
        )}
      </div>
      <nav className="-mx-2 space-y-0.5 border-y border-border py-3">
        {links.map(([label, Icon, fn, active]) => (
          <button key={label} onClick={fn} className={`side-link ${active ? "side-link-active" : ""}`} data-testid={`sidenav-${label.toLowerCase().replace(/\s+/g, "-")}`}><Icon size={17} />{label}</button>
        ))}
      </nav>
      <section className="space-y-2">
        <p className="eyebrow">Filtres d'affichage</p>
        <p className="text-sm font-semibold">Domaines</p>
        <ul className="space-y-1.5">
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICON[d.id] ?? Sprout; const on = !hidden.includes(d.id);
            return (
              <li key={d.id} className="flex items-center gap-2.5">
                <span className="medal-xs" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={12} /></span>
                <span className="flex-1 truncate text-sm">{d.name.split(" ")[0]}</span>
                <button role="switch" aria-checked={on} aria-label={`Afficher ${d.name}`} onClick={() => toggleDomain(d.id)} className="switch" data-on={on} style={{ ["--sw" as string]: "#3b82f6" }} data-testid={`filter-toggle-${d.id}`} />
              </li>
            );
          })}
        </ul>
      </section>
      <section className="space-y-1">
        <p className="text-sm font-semibold">Affichage</p>
        {views.map(([label, Icon, fn, active]) => (
          <button key={label} onClick={fn} className={`side-link ${active ? "side-link-soft" : ""}`} data-testid={`view-${label.toLowerCase().replace(/\s+/g, "-")}`}><Icon size={15} />{label}</button>
        ))}
      </section>
      <button onClick={() => { resetView(); go("/"); }} className="btn-outline mt-auto" data-testid="reset-view-button">Réinitialiser</button>
    </aside>
  );
}
