import { Award, Lock, Printer, Star, Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { Portrait } from "@/components/layout/Portrait";
import { DOMAIN_ICON, domainColor, frDate } from "@/lib/icons";
import { allQuests, badges, xpLevel } from "@/lib/rpg";

export default function ProgressCardPage() {
  const { child, observations } = useApp();
  if (!child) return null;
  const lvl = xpLevel(child.xp);
  const list = badges(child, observations);
  const earned = list.filter((b) => b.earned);
  const next = list.filter((b) => !b.earned).slice(0, 2);
  const wins = allQuests(child).flatMap((q) => q.steps.map((s, i) => ({ s, q, st: child.quest_steps[`${q.id}:${i}`] })))
    .filter((x) => x.st?.status === "fait").sort((a, b) => b.st!.date.localeCompare(a.st!.date)).slice(0, 3);
  const best = [...DOMAINS].sort((a, b) => (child.levels[b.id] ?? 0) - (child.levels[a.id] ?? 0))[0];
  return (
    <div className="page space-y-4" data-testid="progress-card-page">
      <div className="flex items-center gap-3 print:hidden">
        <h1 className="mr-auto font-display text-2xl font-semibold">Carte de progrès</h1>
        <button className="btn-primary" onClick={() => window.print()} data-testid="progress-card-print"><Printer size={15} /> Imprimer / PDF</button>
      </div>
      <article className="progress-card print-card mx-auto max-w-3xl space-y-6 p-8" data-testid="progress-card">
        <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <div className="h-36 w-32 overflow-hidden rounded-2xl border-2 border-amber-300/60 bg-[radial-gradient(ellipse_at_50%_30%,#3b6fb0,#141c3a_75%)]"><Portrait avatar={child.avatar} alt={child.name} /></div>
          <div className="min-w-0 w-full flex-1 space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80">Enfance+ · Carte de progrès</p>
            <h2 className="font-display text-4xl font-bold" data-testid="progress-card-name">Bravo {child.name} !</h2>
            <p className="text-sm text-slate-300">Ton arbre grandit : chaque petit pas compte. Voici tout ce que tu as déjà accompli.</p>
            <p className="text-xs text-slate-400">{frDate(new Date().toISOString())}</p>
          </div>
          <div className="xp-ring h-24 w-24" style={{ ["--p" as string]: `${lvl.progress * 360}deg` }}><span className="h-20 w-20 text-3xl">{lvl.level}</span></div>
        </header>
        <section className="grid gap-2 sm:grid-cols-2">
          {DOMAINS.map((d) => {
            const Icon = DOMAIN_ICON[d.id] ?? Sprout; const l = child.levels[d.id] ?? 1;
            return (
              <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <span className="medal-xs" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={12} /></span>
                <span className="flex-1 text-sm">{d.name.split(" ")[0]}</span>
                {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={14} className={n <= l ? "fill-amber-300 text-amber-300" : "text-slate-600"} />)}
              </div>
            );
          })}
        </section>
        <section className="space-y-2">
          <h3 className="font-display text-lg font-semibold text-amber-200">Mes badges</h3>
          <div className="flex flex-wrap gap-2" data-testid="progress-card-badges">
            {earned.map((b) => <span key={b.id} className="badge badge-on"><Award size={15} /> {b.label}</span>)}
            {next.map((b) => <span key={b.id} className="badge" title={b.desc}><Lock size={13} /> Bientôt : {b.label}</span>)}
          </div>
        </section>
        <section className="space-y-2">
          <h3 className="font-display text-lg font-semibold text-amber-200">Mes dernières réussites</h3>
          {wins.length ? wins.map(({ s, q }) => <p key={q.id + s.title} className="text-sm">✦ <b>{s.title}</b> — {q.title}</p>)
            : <p className="text-sm text-slate-400">Les prochaines réussites apparaîtront ici.</p>}
        </section>
        <footer className="rounded-xl border border-amber-300/30 bg-amber-300/[0.06] p-4 text-sm">
          Ta plus belle branche en ce moment : <b style={{ color: domainColor(best?.id ?? "") }}>{best?.name}</b>. {child.xp} points d'aventure gagnés avec les adultes qui t'accompagnent.
        </footer>
      </article>
    </div>
  );
}
