import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { allQuests } from "@/lib/rpg";
import { domainColor, frDate, isoFromFr } from "@/lib/icons";

interface Ev { date: string; domain: string; kind: string; text: string }

export default function TimelinePage() {
  const { child, observations } = useApp();
  const [filter, setFilter] = useState<string | null>(null);
  if (!child) return null;
  const events: Ev[] = [
    ...observations.map((o) => ({ date: o.date, domain: o.domain_id, kind: "Observation", text: o.fact + (o.context ? ` — ${o.context}` : "") })),
    ...child.level_history.map((h) => ({ date: h.date, domain: h.domain_id, kind: "Niveau", text: `Niveau réévalué : ${h.from} → ${h.to}` })),
    ...allQuests(child).flatMap((q) => q.steps.map((s, i) => ({ q, s, st: child.quest_steps[`${q.id}:${i}`] })).filter((x) => x.st?.status === "fait")
      .map(({ q, s, st }) => ({ date: st!.date, domain: q.domainId, kind: "Étape réalisée", text: `${s.title} · ${q.title} (+50 XP)` }))),
    ...DOMAINS.flatMap((d) => d.observations.map((o) => ({ date: isoFromFr(o.date), domain: d.id, kind: "Exemple fictif", text: o.text }))),
    ...FRAGILITIES.flatMap((f) => f.observations.map((o) => ({ date: isoFromFr(o.date), domain: f.domains[0] ?? "emotionnel", kind: `Défi · ${f.label}`, text: o.text }))),
  ].filter((e) => !filter || e.domain === filter).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="page space-y-4" data-testid="timeline-page">
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        <h1 className="mr-auto font-display text-2xl font-semibold">Chronologie de {child.name}</h1>
        <button className={`chip ${!filter ? "chip-active" : ""}`} onClick={() => setFilter(null)} data-testid="timeline-filter-all">Tous</button>
        {DOMAINS.map((d) => <button key={d.id} className={`chip ${filter === d.id ? "chip-active" : ""}`} style={{ color: domainColor(d.id) }} onClick={() => setFilter(d.id)} data-testid={`timeline-filter-${d.id}`}>{d.name.split(" ")[0]}</button>)}
      </div>
      <ol className="panel relative space-y-4 p-6 pl-10" data-testid="timeline-list">
        <span className="absolute bottom-6 left-[27px] top-6 w-px bg-gradient-to-b from-amber-300/60 via-sky-400/40 to-transparent" />
        {events.map((e, i) => (
          <li key={i} className="relative" data-testid="timeline-event">
            <span className="absolute -left-[19px] top-1.5 h-3 w-3 rounded-full" style={{ background: domainColor(e.domain), boxShadow: `0 0 10px ${domainColor(e.domain)}` }} />
            <p className="text-xs text-muted-foreground">{frDate(e.date)} · <span style={{ color: domainColor(e.domain) }}>{DOMAINS.find((d) => d.id === e.domain)?.name}</span> · <span className="tag">{e.kind}</span></p>
            <p className="text-sm">{e.text}</p>
          </li>
        ))}
        {events.length === 0 && <p className="text-sm text-muted-foreground">Aucun événement.</p>}
      </ol>
    </div>
  );
}
