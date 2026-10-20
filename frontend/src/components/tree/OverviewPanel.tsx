import { Award, Lock, Sparkles, Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { badges, xpLevel } from "@/lib/rpg";

export function OverviewPanel() {
  const { child, observations, openDomain, openAssistant } = useApp();
  if (!child) return null;
  const lvl = xpLevel(child.xp);
  const list = badges(child, observations);
  return (
    <aside className="panel panel-enter flex h-full flex-col gap-5 overflow-y-auto p-5" data-testid="overview-panel">
      <div className="flex items-center gap-4">
        <div className="xp-ring" style={{ ["--p" as string]: `${lvl.progress * 360}deg` }} data-testid="xp-ring"><span>{lvl.level}</span></div>
        <div className="min-w-0">
          <p className="eyebrow">Parcours de {child.name}</p>
          <h2 className="font-display text-2xl font-semibold">Niveau {lvl.level}</h2>
          <p className="text-xs text-muted-foreground" data-testid="xp-total">{child.xp} XP · encore {lvl.toNext} XP avant le niveau {lvl.level + 1}</p>
        </div>
      </div>
      <section className="space-y-2.5">
        <h3 className="text-sm font-semibold">Épanouissement par domaine</h3>
        {DOMAINS.map((d) => {
          const Icon = DOMAIN_ICON[d.id] ?? Sprout; const l = child.levels[d.id] ?? 1;
          return (
            <button key={d.id} onClick={() => openDomain(d.id)} className="flex w-full items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-white/5" data-testid={`overview-domain-${d.id}`}>
              <span className="medal-xs" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={12} /></span>
              <span className="w-24 truncate text-left text-xs">{d.name.split(" ")[0]}</span>
              <span className="level-track flex-1"><span className="level-fill block" style={{ width: `${l * 20}%`, background: domainColor(d.id) }} /></span>
              <span className="w-7 text-right text-xs">{l}/5</span>
            </button>
          );
        })}
      </section>
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Badges</h3>
        <div className="grid grid-cols-2 gap-2">
          {list.map((b) => (
            <div key={b.id} className={`badge ${b.earned ? "badge-on" : ""}`} title={b.desc} data-testid={`badge-${b.id}`}>
              {b.earned ? <Award size={15} /> : <Lock size={13} />}<span className="truncate">{b.label}</span>
            </div>
          ))}
        </div>
      </section>
      <button className="btn-ai mt-auto w-full justify-center" onClick={() => openAssistant(`Quelles sont les 3 priorités d'accompagnement pour ${child.name} en ce moment ?`)} data-testid="overview-ai-priorities"><Sparkles size={15} /> Priorités suggérées par l'IA</button>
    </aside>
  );
}
