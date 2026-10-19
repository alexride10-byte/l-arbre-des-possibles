import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { QUESTS } from "@/data/quests";

const toKey = (d: string) => d.split("/").reverse().join("");

/** Zone inférieure : chronologie des observations fictives + parcours d'accompagnement. */
export function FollowUpZone({ onDomain, onFragility }: { onDomain: (id: string) => void; onFragility: (id: string) => void }) {
  const [tab, setTab] = useState<"chrono" | "parcours">("chrono");
  const [qi, setQi] = useState(0);
  const events = [
    ...DOMAINS.flatMap((d) => d.observations.map((o) => ({ ...o, hue: d.hue, label: d.name, id: d.id, type: "domain" }))),
    ...FRAGILITIES.flatMap((f) => f.observations.map((o) => ({ ...o, hue: 10, label: f.label, id: f.id, type: "fragility" }))),
  ].sort((a, b) => toKey(a.date).localeCompare(toKey(b.date)));
  const q = QUESTS[qi] ?? QUESTS[0];

  return (
    <section className="glass-panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
        <Button variant="ghost" className={`tab ${tab === "chrono" ? "tab-on" : ""}`} onClick={() => setTab("chrono")}>Chronologie</Button>
        <Button variant="ghost" className={`tab ${tab === "parcours" ? "tab-on" : ""}`} onClick={() => setTab("parcours")}>Parcours d'accompagnement</Button>
        <span className="ml-auto hidden text-[10px] text-muted-foreground/70 md:inline">Ni score, ni classement, ni prédiction</span>
      </div>

      {tab === "chrono" ? (
        <div className="flex flex-1 items-stretch gap-3 overflow-x-auto px-4 py-3">
          {events.map((e, i) => (
            <Button variant="ghost" key={i} onClick={() => e.type === "domain" ? onDomain(e.id) : onFragility(e.id)}
              className="timeline-item w-56 shrink-0 text-left" style={{ ["--h" as string]: `oklch(0.8 0.14 ${e.hue})` }}>
              <p className="tag">{e.date} · {e.label}</p>
              <p className="mt-1 line-clamp-3 text-xs text-foreground/85">{e.text}</p>
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {QUESTS.map((x, i) => (
              <Button variant="ghost" key={x.id} onClick={() => setQi(i)} className={`chip ${i === qi ? "chip-active" : ""}`}>{x.title}</Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="self-start" onClick={() => q && onDomain(q.domainId)}>Examiner les observations du domaine</Button>
          <ol className="flex min-h-36 flex-1 gap-3 overflow-x-auto">
            {q?.steps.map((s, i) => (
              <li key={s.title} className={`quest-step w-64 shrink-0 status-${s.status.replace(/\s|à/g, "")}`}>
                <p className="tag">Étape {i + 1} · {s.status}</p>
                <p className="font-display text-lg leading-tight">{s.title}</p>
                <dl className="mt-1 space-y-0.5 text-[11px] text-foreground/80">
                  <div><dt className="inline text-muted-foreground">Objectif : </dt><dd className="inline">{s.objective}</dd></div>
                  <div><dt className="inline text-muted-foreground">Action envisageable : </dt><dd className="inline">{s.action}</dd></div>
                  <div><dt className="inline text-muted-foreground">Ressource : </dt><dd className="inline">{s.resource}</dd></div>
                  <div><dt className="inline text-muted-foreground">Indicateur : </dt><dd className="inline">{s.indicator}</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
