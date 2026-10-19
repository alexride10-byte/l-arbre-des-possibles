import { useState, type ReactNode } from "react";
import { KIND_LABEL, type Domain } from "@/data/domains";
import { ExampleSheetView } from "./ExampleSheet";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="eyebrow">{title}</h3>
      {children}
    </section>
  );
}

const List = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 text-sm text-foreground/85">
    {items.map((t) => <li key={t} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />{t}</li>)}
  </ul>
);

export function DomainPanel({ domain, selectedNode, onNode, onBack }: {
  domain: Domain; selectedNode: string | null; onNode: (id: string) => void; onBack: () => void;
}) {
  const [sheet, setSheet] = useState(false);
  const color = `oklch(0.85 0.13 ${domain.hue})`;
  const node = domain.nodes.find((n) => n.id === selectedNode);

  return (
    <aside className="glass-panel panel-enter flex max-h-full flex-col overflow-hidden">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 p-6">
        <div>
          <p className="eyebrow">Domaine</p>
          <h2 className="font-display text-3xl" style={{ color }}>{domain.name}</h2>
        </div>
        <button onClick={onBack} className="btn-ghost">← Vue générale</button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {sheet && domain.sheet ? (
          <ExampleSheetView sheet={domain.sheet} onClose={() => setSheet(false)} />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-muted-foreground">{domain.intro}</p>

            <Section title="Nœuds">
              <div className="flex flex-wrap gap-2">
                {domain.nodes.map((n) => (
                  <button key={n.id} onClick={() => onNode(n.id)}
                    className={`chip kind-chip-${n.kind} ${selectedNode === n.id ? "chip-active" : ""}`}>
                    {n.label}
                  </button>
                ))}
              </div>
              {node && (
                <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
                  <p className="eyebrow mb-1">{KIND_LABEL[node.kind]}</p>
                  {node.note}
                </div>
              )}
            </Section>

            <div className="grid gap-6 sm:grid-cols-2">
              <Section title="Forces"><List items={domain.strengths} /></Section>
              <Section title="Fragilités (contextuelles)"><List items={domain.fragilities} /></Section>
            </div>

            <Section title="Observations fictives">
              <ul className="space-y-2">
                {domain.observations.map((o) => (
                  <li key={o.date + o.text} className="border-l border-gold/50 pl-3 text-sm">
                    <span className="text-xs text-muted-foreground">{o.date}</span><br />{o.text}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Pistes d'accompagnement"><List items={domain.pistes} /></Section>

            {domain.resources.length > 0 && (
              <Section title="Ressources et références"><List items={domain.resources} /></Section>
            )}

            {domain.sheet && (
              <button onClick={() => setSheet(true)} className="btn-gold w-full">Ouvrir la fiche d'exemple</button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
