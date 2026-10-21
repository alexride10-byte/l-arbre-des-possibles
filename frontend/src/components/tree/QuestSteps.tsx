import { Check, Circle, Loader, Trash2, Sparkles } from "lucide-react";
import { send, type Child } from "@/lib/api";
import type { Quest } from "@/data/quests";
import { useApp } from "@/context/AppContext";
import { stepStatus } from "@/lib/rpg";
import type { StepStatus } from "@/lib/api";
import { domainColor } from "@/lib/icons";

const NEXT: Record<StepStatus, StepStatus> = { "à venir": "en cours", "en cours": "fait", fait: "à venir" };
const ICON = { fait: Check, "en cours": Loader, "à venir": Circle };

export function QuestCard({ quest, detailed = false }: { quest: Quest; detailed?: boolean }) {
  const { child, setStep, saveChild, user, canWrite } = useApp();
  if (!child) return null;
  const statuses = quest.steps.map((s, i) => stepStatus(child, quest.id, i, s.status));
  const done = statuses.filter((s) => s === "fait").length;
  return (
    <article className="quest-card space-y-3" style={{ ["--c" as string]: domainColor(quest.domainId) }} data-testid={`quest-${quest.id}`}>
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-sm font-semibold">{quest.title}</p><p className="text-[11px] text-muted-foreground">{quest.term}</p></div>
        <div className="flex shrink-0 items-center gap-1.5">
          {quest.custom && <span className="pill-ai" title="Quête créée par l'IA"><Sparkles size={10} /> IA</span>}
          <span className="pill-muted" data-testid={`quest-progress-${quest.id}`}>{done}/{quest.steps.length}</span>
          {quest.custom && child.user_id === user.user_id && <button className="icon-btn h-7 w-7" aria-label="Supprimer la quête" data-testid={`quest-delete-${quest.id}`}
            onClick={async () => { if (window.confirm("Supprimer cette quête ?")) saveChild(await send<Child>(`/children/${child.child_id}/quests/${quest.id}`, "DELETE")); }}><Trash2 size={13} /></button>}
        </div>
      </div>
      <div className="level-track"><div className="level-fill quest-fill" style={{ width: `${(done / quest.steps.length) * 100}%` }} /></div>
      <ol className="space-y-1.5">
        {quest.steps.map((s, i) => {
          const st = statuses[i]!; const I = ICON[st];
          return (
            <li key={i}>
              <button disabled={!canWrite} onClick={() => setStep(quest.id, i, NEXT[st])} className={`step-row step-${st.replace(/\s|à/g, "")}`} title="Cliquer pour changer le statut" data-testid={`quest-step-${quest.id}-${i}`}>
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
