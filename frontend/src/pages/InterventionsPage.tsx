import { Sparkles, Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { QuestCard } from "@/components/tree/QuestSteps";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { allQuests, doneSteps, xpLevel } from "@/lib/rpg";
import { GenerateQuest } from "@/components/tree/GenerateQuest";

export default function InterventionsPage() {
  const { child, openAssistant } = useApp();
  if (!child) return null;
  const quests = allQuests(child);
  const total = quests.reduce((n, q) => n + q.steps.length, 0);
  const done = doneSteps(child);
  const lvl = xpLevel(child.xp);
  return (
    <div className="page space-y-4" data-testid="interventions-page">
      <section className="panel flex flex-wrap items-center gap-6 p-5">
        <div className="mr-auto"><p className="eyebrow">Parcours d'accompagnement</p><h1 className="font-display text-3xl font-semibold">Interventions et quêtes</h1></div>
        <div className="stat"><b data-testid="interventions-done-count">{done}/{total}</b><span>étapes réalisées</span></div>
        <div className="stat"><b>{child.xp} XP</b><span>Niveau {lvl.level}</span></div>
        <button className="btn-outline" onClick={() => openAssistant(`Quelles quêtes d'accompagnement seraient les plus utiles pour ${child.name} en ce moment ?`)} data-testid="ai-quest-advice-button"><Sparkles size={15} /> Conseils de l'IA</button>
      </section>
      <GenerateQuest />
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {DOMAINS.map((d) => {
          const qs = quests.filter((q) => q.domainId === d.id); const Icon = DOMAIN_ICON[d.id] ?? Sprout;
          return (
            <section key={d.id} className="panel space-y-3 p-4" data-testid={`interventions-domain-${d.id}`}>
              <h2 className="flex items-center gap-2 font-semibold"><span className="medal-xs" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={12} /></span>{d.name}</h2>
              {qs.map((q) => <QuestCard key={q.id} quest={q} detailed />)}
              <div className="space-y-1">{d.pistes.map((p) => <p key={p} className="text-xs text-muted-foreground">• {p}</p>)}</div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
