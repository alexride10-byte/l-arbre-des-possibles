import { Check, Circle, Loader } from "lucide-react";
import type { Quest } from "@/data/quests";
import type { StepStatus } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { stepStatus } from "@/lib/rpg";
import { domainColor } from "@/lib/icons";

const NEXT: Record<StepStatus, StepStatus> = { "à venir": "en cours", "en cours": "fait", fait: "à venir" };
const ICON = { fait: Check, "en cours": Loader, "à venir": Circle };

export function QuestCard({ quest, detailed = false }: { quest: Quest; detailed?: boolean }) {
  const { child, setStep } = useApp();
  if (!child) return null;
  const statuses = quest.steps.map((s, i) => stepStatus(child, quest.id, i, s.status));
  const done = statuses.filter((s) => s === "fait").length;
  return (
    <article className="quest-card space-y-3" style={{ ["--c" as string]: domainColor(quest.domainId) }} data-testid={`quest-${quest.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-sm font-semibold">{quest.title}</p><p className="text-[11px] text-muted-foreground">{quest.term}</p></div>
        <span className="pill-muted shrink-0" data-testid={`quest-progress-${quest.id}`}>{done}/{quest.steps.length}</span>
      </div>
      <div className="level-track"><div className="level-fill quest-fill" style={{ width: `${(done / quest.steps.length) * 100}%` }} /></div>
      <ol className="space-y-1.5">
        {quest.steps.map((s, i) => {
          const st = statuses[i]!; const I = ICON[st];
          return (
            <li key={s.title}>
              <button onClick={() => setStep(quest.id, i, NEXT[st])} className={`step-row step-${st.replace(/\s|à/g, "")}`} title="Cliquer pour changer le statut" data-testid={`quest-step-${quest.id}-${i}`}>
                <I size={14} className="shrink-0" />
                <span className="min-w-0 flex-1 text-left"><span className="block text-sm">{s.title}</span>{detailed && <span className="block text-[11px] text-muted-foreground">{s.action} · Indicateur : {s.indicator}</span>}</span>
                <span className="text-[10px] uppercase tracking-wider">{st}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
