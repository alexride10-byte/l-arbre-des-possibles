import { useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, ChevronRight, Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { DOMAIN_ART } from "@/lib/assets";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { allQuests, skillPct, stepStatus } from "@/lib/rpg";
import { ScoreRing } from "@/components/layout/ScoreRing";
import { DetailsTab, ActionsTab, ImpactsTab, ResourcesTab } from "@/components/tree/DomainTabs";
import { LevelBar } from "@/components/tree/DetailPanel";

const TABS = [["details", "Vue d'ensemble"], ["actions", "Activités"], ["impacts", "Suivi"], ["ressources", "Ressources"]] as const;

export default function DomainPage() {
  const { id = "" } = useParams();
  const { child } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("details");
  const domain = DOMAINS.find((d) => d.id === id);
  if (!domain) return <Navigate to="/" />;
  if (!child) return null;
  const art = DOMAIN_ART[domain.id]!;
  const level = child.levels[domain.id] ?? 1;
  const Icon = DOMAIN_ICON[domain.id] ?? Sprout;
  const quests = allQuests(child).filter((q) => q.domainId === domain.id);
  return (
    <div className="page space-y-4" style={{ ["--c" as string]: domainColor(domain.id) }} data-testid={`domain-page-${domain.id}`}>
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/" className="btn-outline h-9" data-testid="domain-back"><ArrowLeft size={14} /> Retour</Link>
        <span className="medal-sm" style={{ ["--c" as string]: domainColor(domain.id) }}><Icon size={17} /></span>
        <div><h1 className="font-display text-3xl font-semibold" style={{ color: domainColor(domain.id) }}>{domain.name}</h1><p className="text-xs text-muted-foreground">{domain.intro}</p></div>
        <div className="ml-auto flex flex-wrap gap-1.5">{DOMAINS.map((d) => <Link key={d.id} to={`/domaine/${d.id}`} className={`chip ${d.id === domain.id ? "chip-active" : ""}`} style={{ color: domainColor(d.id) }} data-testid={`domain-switch-${d.id}`}>{d.name.split(" ")[0]}</Link>)}</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="domain-hero" style={{ backgroundImage: `url(${art.img})` }} data-testid="domain-hero">
          <p className="domain-quote">{art.quote}</p>
          <p className="absolute bottom-3 left-4 text-[10px] text-white/60">Illustration · {child.name}</p>
        </section>
        <section className="panel domain-glow space-y-4 p-5">
          <div className="flex items-center gap-4">
            <ScoreRing value={level * 20} size={92} color={`var(--domain-${domain.id})`} />
            <div><p className="text-xs text-muted-foreground">Niveau actuel</p><p className="font-display text-3xl font-bold">{level * 20}<span className="text-base text-muted-foreground"> / 100</span></p>
              <p className="text-sm" style={{ color: domainColor(domain.id) }}>{level >= 4 ? "Excellent" : level >= 3 ? "Bon progrès" : "À accompagner"}</p></div>
          </div>
          <LevelBar domainId={domain.id} />
          <h3 className="text-sm font-semibold">Compétences clés</h3>
          {domain.nodes.map((n, i) => {
            const pct = skillPct(level, n.kind, i);
            return (
              <div key={n.id} className="space-y-1" data-testid={`domain-skill-${n.id}`}>
                <p className="flex justify-between text-xs"><span>{n.label}</span><span className="text-muted-foreground">{pct}%</span></p>
                <div className="level-track h-1.5"><div className="level-fill" style={{ width: `${pct}%`, background: domainColor(domain.id), boxShadow: `0 0 10px ${domainColor(domain.id)}` }} /></div>
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground">Estimations indicatives dérivées du niveau évalué par l'adulte, pas une mesure.</p>
        </section>
      </div>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Activités recommandées</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quests.map((q) => {
            const done = q.steps.filter((s, i) => stepStatus(child, q.id, i, s.status) === "fait").length;
            return (
              <button key={q.id} className="activity-card" onClick={() => setTab("actions")} data-testid={`domain-activity-${q.id}`}>
                <span className="activity-thumb" style={{ backgroundImage: `url(${art.img})` }} />
                <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{q.title}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Clock size={11} /> {q.term.split(" (")[0]} · {done}/{q.steps.length}</span></span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel p-5">
        <div className="tabbar mb-4 max-w-xl">{TABS.map(([t, l]) => <button key={t} className={`tabbar-btn ${tab === t ? "tabbar-on" : ""}`} onClick={() => setTab(t)} data-testid={`domain-tab-${t}`}>{l}</button>)}</div>
        <div className="space-y-5">
          {tab === "details" && <DetailsTab domain={domain} />}
          {tab === "actions" && <ActionsTab domain={domain} />}
          {tab === "impacts" && <ImpactsTab domain={domain} />}
          {tab === "ressources" && <ResourcesTab domain={domain} />}
        </div>
      </section>
    </div>
  );
}
