import { Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FUTURE } from "@/lib/assets";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { HORIZONS, SCENARIOS, doneSteps, futureOutcomes, projectedLevels } from "@/lib/rpg";
import { SimulationZone } from "@/components/sim/SimulationZone";
import { Portrait } from "@/components/layout/Portrait";
import { DOMAINS } from "@/data/domains";

export default function FuturePage() {
  const { child, scenario, setScenario, openAssistant } = useApp();
  if (!child) return null;
  const m = doneSteps(child);
  const s = SCENARIOS.find((x) => x.id === scenario)!;
  const outcomes = futureOutcomes(child.levels, scenario, m);
  const stops = HORIZONS.filter((h) => [0, 1, 2, 3, 5].includes(h.t));
  return (
    <div className="page space-y-4" data-testid="future-page">
      <section className="future-hero" style={{ backgroundImage: `url(${FUTURE})`, filter: scenario === "risque" ? "saturate(.55)" : undefined }}>
        <div className="text-center"><h1 className="font-display text-4xl font-bold drop-shadow-lg">Explorer son futur possible</h1>
          <p className="text-sm text-slate-200">Une visualisation inspirante basée sur ses progrès actuels. Illustrative, jamais prédictive.</p></div>
        <aside className="future-keys" data-testid="future-keys">
          <p className="mb-2 text-sm font-semibold">Les clés de son futur</p>
          {outcomes.map((o) => { const I = DOMAIN_ICON[o.id] ?? Sparkles; return <p key={o.id} className="flex items-center gap-2 py-1 text-xs"><I size={13} style={{ color: domainColor(o.id) }} />{o.text}</p>; })}
          <button className="btn-primary mt-3 w-full" onClick={() => openAssistant(`Décris de façon illustrative (non prédictive) le « ${s.label} » pour ${child.name} sur 5 ans : leviers, vigilance, indicateurs.`)} data-testid="future-explore-ai">Explorer avec l'IA</button>
        </aside>
      </section>
      <div className="flex flex-wrap gap-2">{SCENARIOS.map((x) => <button key={x.id} onClick={() => setScenario(x.id)} className={`scenario-btn ${scenario === x.id ? "scenario-on" : ""}`} data-testid={`future-scenario-${x.id}`}><span className="h-2.5 w-2.5 rounded-full" style={{ background: x.color }} />{x.label}</button>)}</div>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5" data-testid="future-timeline">
        {stops.map((h) => {
          const p = projectedLevels(child.levels, scenario, h.t, m);
          const score = Math.round((DOMAINS.reduce((n, d) => n + (p[d.id] ?? 1), 0) / DOMAINS.length) * 20);
          return (
            <div key={h.label} className="panel overflow-hidden">
              <div className="h-28" style={{ filter: `brightness(${0.75 + h.t * 0.06})` }}><Portrait avatar={child.avatar} alt="" /></div>
              <div className="flex items-center justify-between p-3"><span className="text-xs">{h.label === "Aujourd'hui" ? h.label : `${child.age + h.t} ans`}</span><b className="text-sm" style={{ color: s.color }}>{score}</b></div>
            </div>
          );
        })}
      </section>
      <div className="h-72"><SimulationZone /></div>
    </div>
  );
}
