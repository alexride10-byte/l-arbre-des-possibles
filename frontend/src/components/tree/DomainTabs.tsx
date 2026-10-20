import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Sparkles } from "lucide-react";
import type { Domain } from "@/data/domains";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { QUESTS } from "@/data/quests";
import { useApp } from "@/context/AppContext";
import { domainColor, frDate, isoFromFr } from "@/lib/icons";
import { FactorMini } from "./FactorMini";
import { QuestCard } from "./QuestSteps";
import { ObservationsEditor } from "./ObservationsEditor";
import { ExampleSheetView } from "./ExampleSheet";

const H = ({ children }: { children: ReactNode }) => <h3 className="text-sm font-semibold">{children}</h3>;
const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 text-sm text-foreground/85">{items.map((t) => <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />{t}</li>)}</ul>
);

export function DetailsTab({ domain }: { domain: Domain }) {
  const { child, openNode, openAssistant, setFactorId, node } = useApp();
  const navigate = useNavigate();
  const quests = QUESTS.filter((q) => q.domainId === domain.id);
  const pistes = [...quests.map((q) => ({ t: q.title, term: q.term })), ...domain.pistes.map((p, i) => ({ t: p, term: i ? "Moyen terme (1–3 mois)" : "Court terme (2–4 semaines)" }))].slice(0, 4);
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {domain.nodes.map((n) => <button key={n.id} onClick={() => openNode(domain.id, n.id)} className={`chip kind-chip-${n.kind} ${node === n.id ? "chip-active" : ""}`} data-testid={`detail-node-${n.id}`}>{n.label}</button>)}
      </div>
      <section className="space-y-2"><H>Facteurs associés</H><FactorMini domain={domain} onFactor={setFactorId} /></section>
      <section className="space-y-2">
        <H>Pistes d'intervention</H>
        {pistes.map((p) => (
          <button key={p.t} className="piste-row" onClick={() => openAssistant(`Détaille la piste « ${p.t} » pour ${child?.name} (domaine ${domain.name}) : étapes concrètes, durée et indicateurs.`)} data-testid="piste-row">
            <span className="medal-xs" style={{ ["--c" as string]: domainColor(domain.id) }}><Sparkles size={11} /></span>
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm">{p.t}</span><span className="text-[11px] text-muted-foreground">{p.term}</span></span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}
        <button className="btn-outline w-full" onClick={() => navigate("/interventions")} data-testid="see-all-interventions">Voir toutes les interventions ({QUESTS.length + DOMAINS.reduce((n, d) => n + d.pistes.length, 0)})</button>
      </section>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-2"><H>Forces</H><List items={domain.strengths} /></section>
        <section className="space-y-2"><H>Fragilités (contextuelles)</H><List items={domain.fragilities} /></section>
      </div>
    </>
  );
}

export function ActionsTab({ domain }: { domain: Domain }) {
  const [sheet, setSheet] = useState(false);
  const quests = QUESTS.filter((q) => q.domainId === domain.id);
  if (sheet && domain.sheet) return <ExampleSheetView sheet={domain.sheet} onClose={() => setSheet(false)} />;
  return (
    <>
      <p className="text-xs text-muted-foreground">Chaque étape réalisée rapporte <b className="text-gold">+50 XP</b> au parcours d'accompagnement.</p>
      {quests.map((q) => <QuestCard key={q.id} quest={q} />)}
      {quests.length === 0 && <p className="text-sm text-muted-foreground">Aucune quête pour ce domaine.</p>}
      {domain.sheet && <button onClick={() => setSheet(true)} className="btn-outline w-full" data-testid="open-example-sheet">Ouvrir la fiche d'exemple</button>}
    </>
  );
}

export function ImpactsTab({ domain }: { domain: Domain }) {
  const { child, openFrag, openDomain } = useApp();
  const frags = FRAGILITIES.filter((f) => f.domains.includes(domain.id));
  const linked = [...new Set(frags.flatMap((f) => f.domains))].filter((id) => id !== domain.id);
  const history = (child?.level_history ?? []).filter((h) => h.domain_id === domain.id).slice(-5).reverse();
  return (
    <>
      <section className="space-y-2"><H>Défis liés</H>
        <div className="flex flex-wrap gap-2">{frags.map((f) => <button key={f.id} className="chip chip-frag" onClick={() => openFrag(f.id)} data-testid={`impact-frag-${f.id}`}>{f.label}</button>)}</div>
      </section>
      <section className="space-y-2"><H>Domaines en interaction</H>
        <div className="flex flex-wrap gap-2">{linked.map((id) => <button key={id} className="chip" style={{ color: domainColor(id) }} onClick={() => openDomain(id)} data-testid={`impact-domain-${id}`}>{DOMAINS.find((d) => d.id === id)?.name} →</button>)}</div>
        <p className="text-[11px] text-muted-foreground">Ces liens sont des pistes d'examen, pas des causes démontrées.</p>
      </section>
      <section className="space-y-2"><H>Évolution du niveau</H>
        {history.length === 0 ? <p className="text-xs text-muted-foreground">Pas encore de réévaluation.</p>
          : history.map((h) => <p key={h.date} className="text-xs"><span className="text-muted-foreground">{frDate(h.date)}</span> · {h.from} → <b className={h.to > h.from ? "text-emerald-300" : "text-red-300"}>{h.to}</b></p>)}
      </section>
    </>
  );
}

export function ResourcesTab({ domain }: { domain: Domain }) {
  const { child, openAssistant } = useApp();
  return (
    <>
      {domain.resources.length > 0 && <section className="space-y-2"><H>Ressources et références</H><List items={domain.resources} /></section>}
      <section className="space-y-2"><H>Observations d'exemple</H>
        {domain.observations.map((o) => <p key={o.text} className="border-l border-gold/50 pl-3 text-sm"><span className="text-xs text-muted-foreground">{frDate(isoFromFr(o.date))}</span><br />{o.text}</p>)}
      </section>
      <ObservationsEditor domainId={domain.id} />
      <button className="btn-ai w-full justify-center" onClick={() => openAssistant(`Fais une synthèse du domaine « ${domain.name} » pour ${child?.name} à partir des observations.`)} data-testid="domain-ai-synthesis"><Sparkles size={15} /> Synthèse IA du domaine</button>
    </>
  );
}
