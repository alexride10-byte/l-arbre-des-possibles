import { Phone, UserRound, BookMarked } from "lucide-react";
import { DOMAINS } from "@/data/domains";
import { domainColor } from "@/lib/icons";

const PEOPLE = [
  ["Éducatrice référente", "Adulte refuge au quotidien (exemple fictif)"],
  ["Enseignant·e de CE2", "Suivi des apprentissages et des transitions"],
  ["Psychologue de l'Éducation nationale", "Évaluation et conseil, sur demande de la famille ou de l'école"],
  ["Médecin traitant / PMI", "Santé, sommeil, développement"],
  ["Famille", "Premiers partenaires de l'accompagnement"],
];
const HELP = [
  ["119", "Allô Enfance en Danger — 24h/24, gratuit"],
  ["15 / 112", "Urgence médicale ou danger immédiat"],
  ["0 800 235 236", "Fil Santé Jeunes — écoute anonyme et gratuite"],
];

export default function ResourcesPage() {
  return (
    <div className="page grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]" data-testid="resources-page">
      <section className="panel space-y-4 p-6">
        <h1 className="font-display text-3xl font-semibold">Ressources</h1>
        <div className="grid gap-3 md:grid-cols-2">
          {DOMAINS.map((d) => (
            <article key={d.id} className="rounded-xl border border-border p-4" data-testid={`resource-domain-${d.id}`}>
              <p className="mb-2 font-semibold" style={{ color: domainColor(d.id) }}>{d.name}</p>
              {[...d.resources, ...d.pistes].map((r) => <p key={r} className="flex gap-2 text-sm text-foreground/85"><BookMarked size={14} className="mt-0.5 shrink-0 text-muted-foreground" />{r}</p>)}
            </article>
          ))}
        </div>
      </section>
      <div className="space-y-4">
        <section className="panel space-y-3 p-5" id="personnes" data-testid="resource-people">
          <h2 className="font-display text-xl font-semibold">Personnes ressources</h2>
          {PEOPLE.map(([n, d]) => <div key={n} className="flex gap-3"><span className="medal-sm"><UserRound size={15} /></span><div><p className="text-sm font-semibold">{n}</p><p className="text-xs text-muted-foreground">{d}</p></div></div>)}
        </section>
        <section className="panel space-y-3 border-red-400/30 p-5" data-testid="resource-emergency">
          <h2 className="font-display text-xl font-semibold">Numéros utiles (France)</h2>
          {HELP.map(([n, d]) => <p key={n} className="flex items-center gap-3 text-sm"><Phone size={15} className="text-red-300" /><b>{n}</b><span className="text-xs text-muted-foreground">{d}</span></p>)}
        </section>
      </div>
    </div>
  );
}
