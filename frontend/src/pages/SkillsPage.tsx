import { Award, Lock, Star, Sprout } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Legend } from "recharts";
import { useApp } from "@/context/AppContext";
import { DOMAINS, KIND_LABEL } from "@/data/domains";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { badges, xpLevel } from "@/lib/rpg";

export default function SkillsPage() {
  const { child, observations, setLevel } = useApp();
  if (!child) return null;
  const data = DOMAINS.map((d) => ({ domain: d.name.split(" ")[0], initial: child.initial_levels[d.id] ?? 1, actuel: child.levels[d.id] ?? 1 }));
  const lvl = xpLevel(child.xp);
  return (
    <div className="page space-y-4" data-testid="skills-page">
      <div className="grid gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="panel p-5">
          <p className="eyebrow">Fiche de compétences</p>
          <h1 className="font-display text-3xl font-semibold">{child.name} · Niveau {lvl.level}</h1>
          <div className="h-72" data-testid="skills-radar">
            <ResponsiveContainer>
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="rgba(148,163,255,.2)" />
                <PolarAngleAxis dataKey="domain" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <Radar name="Initial" dataKey="initial" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.12} />
                <Radar name="Actuel" dataKey="actuel" stroke="#fbbf24" fill="#fbbf24" fillOpacity={0.3} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {badges(child, observations).map((b) => (
              <div key={b.id} className={`badge ${b.earned ? "badge-on" : ""}`} title={b.desc}>{b.earned ? <Award size={15} /> : <Lock size={13} />}<span className="truncate">{b.label}</span></div>
            ))}
          </div>
        </section>
        <section className="grid content-start gap-3 md:grid-cols-2">
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICON[d.id] ?? Sprout; const l = child.levels[d.id] ?? 1;
            return (
              <article key={d.id} className="panel space-y-3 p-4" data-testid={`skill-card-${d.id}`}>
                <div className="flex items-center gap-3">
                  <span className="medal-sm" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={16} /></span>
                  <p className="flex-1 font-semibold">{d.name}</p>
                  <div className="flex" role="radiogroup" aria-label={`Niveau ${d.name}`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setLevel(d.id, n)} aria-label={`Niveau ${n}`} data-testid={`skill-star-${d.id}-${n}`}>
                        <Star size={17} className={n <= l ? "fill-amber-300 text-amber-300" : "text-slate-600"} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {d.nodes.map((n) => <span key={n.id} className={`chip kind-chip-${n.kind}`} title={`${KIND_LABEL[n.kind]} · ${n.note}`}>{n.label}</span>)}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}
