import { ArrowLeft, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Factor } from "@/data/factors";

export function FactorPanel({ factor, onNetwork, onBack }: { factor: Factor; onNetwork: () => void; onBack: () => void }) {
  const sections = [
    ["Faits observés", factor.facts, "sheet-fact"],
    ["Propos rapportés", factor.reported.length ? factor.reported : ["Aucun propos consigné pour ce facteur."], "sheet-fact"],
    ["Hypothèses à examiner", factor.hypotheses, "sheet-hypo"],
    ["Informations inconnues", factor.unknown, "sheet-hypo"],
    ["Facteurs protecteurs et ressources", factor.resources, "sheet-reco"],
    ["Pistes d'accompagnement", factor.actions, "sheet-reco"],
    ["Indicateurs d'évolution", factor.indicators, "sheet-reco"],
  ] as const;
  return <aside className="glass-panel panel-enter flex max-h-full flex-col overflow-hidden" aria-label="Fiche du facteur">
    <header className="shrink-0 space-y-3 border-b border-border p-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onNetwork}><ArrowLeft /> Réseau précédent</Button>
        <Button variant="ghost" size="sm" onClick={onBack}><TreeDeciduous /> Arbre complet</Button>
      </div>
      <p className="eyebrow">Facteur possible · exemple fictif</p>
      <h2 className="font-display text-3xl">{factor.label}</h2>
    </header>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 text-sm">
      <p className="text-muted-foreground">{factor.description}</p>
      <p className="border-l-2 border-gold pl-3 text-xs">Association à explorer, pas preuve de causalité. L'anxiété ne prouve pas une maltraitance.</p>
      <p className="text-xs text-muted-foreground">Contexte : {factor.context}</p>
      {sections.map(([title, items, tone]) => <section key={title} className="space-y-2"><h3 className="eyebrow">{title}</h3>{items.map((text) => <p key={text} className={`sheet-block ${tone}`}>{text}</p>)}</section>)}
    </div>
  </aside>;
}