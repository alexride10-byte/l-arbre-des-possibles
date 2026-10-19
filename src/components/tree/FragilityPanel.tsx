import type { Fragility } from "@/data/fragilities";
import { DOMAINS } from "@/data/domains";

export function FragilityPanel({ f, onBack, onDomain }: { f: Fragility; onBack: () => void; onDomain: (id: string) => void }) {
  return (
    <aside className="glass-panel panel-enter flex max-h-full flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 p-5">
        <div className="min-w-0">
          <p className="eyebrow">Défi ou fragilité · évolutive</p>
          <h2 className="font-display text-3xl text-fragility">{f.label}</h2>
        </div>
        <button onClick={onBack} className="btn-ghost shrink-0">← Vue générale</button>
      </header>
      <div className="flex-1 space-y-5 overflow-y-auto p-5 text-sm">
        <p className="leading-relaxed text-muted-foreground">{f.intro}</p>
        <section className="space-y-2">
          <h3 className="eyebrow">Faits observés</h3>
          {f.observations.map((o) => (
            <div key={o.text} className="sheet-block sheet-fact"><p className="tag">{o.date}</p><p>{o.text}</p></div>
          ))}
        </section>
        <section className="space-y-2">
          <h3 className="eyebrow">Contextes à considérer</h3>
          <div className="flex flex-wrap gap-2">{f.contexts.map((c) => <span key={c} className="chip">{c}</span>)}</div>
        </section>
        <section className="space-y-2">
          <h3 className="eyebrow">Relations possibles</h3>
          <div className="flex flex-wrap gap-2">
            {f.domains.map((id) => {
              const d = DOMAINS.find((x) => x.id === id)!;
              return <button key={id} onClick={() => onDomain(id)} className="chip" style={{ color: `oklch(0.85 0.13 ${d.hue})` }}>{d.name} →</button>;
            })}
          </div>
          <p className="text-xs text-muted-foreground/80">Ces liens sont des pistes d'examen, pas des causes démontrées.</p>
        </section>
        <section className="space-y-2">
          <h3 className="eyebrow">Hypothèses à examiner</h3>
          {f.hypotheses.map((h) => <div key={h} className="sheet-block sheet-hypo">{h}</div>)}
        </section>
        <section className="space-y-2">
          <h3 className="eyebrow">Interventions possibles</h3>
          {f.interventions.map((h) => <div key={h} className="sheet-block sheet-reco">{h}</div>)}
        </section>
      </div>
    </aside>
  );
}
