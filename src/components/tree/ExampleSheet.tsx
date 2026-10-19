import type { ExampleSheet } from "@/data/domains";

function Block({ tag, tone, title, children }: { tag: string; tone: "fact" | "hypo" | "reco"; title: string; children: React.ReactNode }) {
  return (
    <div className={`sheet-block sheet-${tone}`}>
      <div className="mb-1 flex items-center justify-between">
        <h4 className="text-sm font-semibold">{title}</h4>
        <span className="tag">{tag}</span>
      </div>
      <div className="text-sm text-foreground/85">{children}</div>
    </div>
  );
}

const Ul = ({ items }: { items: string[] }) => (
  <ul className="list-disc space-y-1 pl-4">{items.map((i) => <li key={i}>{i}</li>)}</ul>
);

export function ExampleSheetView({ sheet, onClose }: { sheet: ExampleSheet; onClose: () => void }) {
  return (
    <div className="space-y-4">
      <button onClick={onClose} className="btn-ghost">← Retour au domaine</button>
      <div>
        <p className="eyebrow">Fiche d'exemple · {sheet.date}</p>
        <h3 className="font-display text-2xl">{sheet.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Situation fictive. Une fragilité décrit un moment et un contexte, jamais l'enfant lui-même.
        </p>
      </div>
      <Block tag="Fait observé" tone="fact" title="Observation">{sheet.observation}</Block>
      <Block tag="Fait observé" tone="fact" title="Contexte">{sheet.context}</Block>
      <Block tag="Fait observé" tone="fact" title="Ressources déjà présentes"><Ul items={sheet.existingResources} /></Block>
      <Block tag="Hypothèse" tone="hypo" title="Hypothèses à examiner"><Ul items={sheet.hypotheses} /></Block>
      <Block tag="Recommandation" tone="reco" title="Pistes d'accompagnement"><Ul items={sheet.pistes} /></Block>
      <Block tag="Recommandation" tone="reco" title="Indicateurs d'évolution"><Ul items={sheet.indicators} /></Block>
    </div>
  );
}
