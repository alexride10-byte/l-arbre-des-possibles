import { HelpCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { SCENARIOS, doneSteps, futureOutcomes } from "@/lib/rpg";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";

const IMG = "https://static.prod-images.emergentagent.com/jobs/5a8bc270-5ed8-4704-a01d-2ff7d09abd2b/images/d5915a1c85096e219fae7cd3564d712d902d28da8643f49f0f91f369f5961972.jpeg";

export function FuturePreview() {
  const { child, scenario, openAssistant } = useApp();
  if (!child) return null;
  const s = SCENARIOS.find((x) => x.id === scenario)!;
  const outcomes = futureOutcomes(child.levels, scenario, doneSteps(child));
  const Trend = scenario === "risque" ? TrendingDown : scenario === "stable" ? Minus : TrendingUp;
  return (
    <section className="panel future-zone flex min-h-0 flex-col gap-3 p-4" data-testid="future-preview">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">Aperçu du futur possible
        <span title="Illustration non prédictive"><HelpCircle size={15} className="text-muted-foreground" /></span></h3>
      <div className="flex min-h-0 flex-1 gap-3">
        <img src={IMG} alt="Enfant regardant un chemin lumineux vers l'avenir" className="h-full max-h-36 w-32 shrink-0 rounded-lg object-cover xl:w-36" style={{ filter: scenario === "risque" ? "saturate(.4) brightness(.75)" : undefined }} />
        <ul className="min-w-0 flex-1 space-y-1.5" data-testid="future-outcomes">
          {outcomes.map((o) => {
            const Icon = DOMAIN_ICON[o.id] ?? Trend;
            return (
              <li key={o.id} className="flex items-center gap-2 text-xs">
                <Icon size={13} style={{ color: domainColor(o.id) }} className="shrink-0" />
                <span className="truncate">{o.text}</span>
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{o.from}→{o.to.toFixed(1)}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <button className="btn-primary" data-testid="explore-scenario-button"
        onClick={() => openAssistant(`Décris de façon illustrative (non prédictive) le « ${s.label} » pour ${child.name} sur 5 ans : leviers, points de vigilance et indicateurs à suivre.`)}>
        Explorer ce scénario en détail
      </button>
    </section>
  );
}
