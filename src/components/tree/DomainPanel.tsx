import { useState, type ReactNode } from "react";
import { KIND_LABEL, type Domain } from "@/data/domains";
import { Button } from "@/components/ui/button";
import { FRAGILITIES } from "@/data/fragilities";
import { ExampleSheetView } from "./ExampleSheet";
import { ObservationsEditor } from "./ObservationsEditor";

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

export function DomainPanel({ domain, selectedNode, onNode, onBack, onFragility }: {
  domain: Domain; selectedNode: string | null; onNode: (id: string) => void; onBack: () => void; onFragility: (id: string) => void;
}) {
  const [sheet, setSheet] = useState(false);
  const color = `oklch(0.85 0.13 ${domain.hue})`;
  const node = domain.nodes.find((n) => n.id === selectedNode);

  return (
    <aside className="glass-panel panel-enter flex max-h-full flex-col overflow-hidden">
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 border-b border-border/60 p-4">
        <div className="min-w-0">
          <p className="eyebrow">Domaine</p>
          <h2 className="font-display text-2xl" style={{ color }}>{domain.name}</h2>
        </div>
        <button onClick={onBack} className="btn-ghost">← Vue générale</button>
      </header>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">
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

            <Section title="Défis à explorer">
              <div className="flex flex-wrap gap-2">{FRAGILITIES.filter((f) => f.domains.includes(domain.id)).map((f) => <Button variant="outline" size="sm" key={f.id} onClick={() => onFragility(f.id)}>{f.label}</Button>)}</div>
            </Section>

            <Section title="Observations fictives">
              <ul className="space-y-2">
                {domain.observations.map((o) => (
                  <li key={o.date + o.text} className="border-l border-gold/50 pl-3 text-sm">
                    <span className="text-xs text-muted-foreground">{o.date}</span><br />{o.text}
                  </li>
                ))}
              </ul>
            </Section>

            <ObservationsEditor domainId={domain.id} />

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
