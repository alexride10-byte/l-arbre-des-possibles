import { DOMAINS_L, NODES_L, ROOTS_L } from "../data/launcher";
import { linksFor, type LinkGroup, type LinkTarget } from "../logic/links";
import { Disclaimer, Section, Sheet } from "./Sheet";

interface Props { id: string; onClose: () => void; onDomain: (id: string) => void; onNode: (id: string) => void }

function Chips({ items, onPick }: { items: LinkTarget[]; onPick: (l: LinkTarget) => void }) {
  if (!items.length) return <p className="lx-muted">Aucun lien renseigné pour l'instant.</p>;
  return (
    <div className="lx-chips">
      {items.map((l) => (
        <button key={l.id} className="lx-chip" style={{ "--c": l.color } as React.CSSProperties} onClick={() => onPick(l)} data-testid={`link-chip-${l.id}`}>
          <span className="lx-chip-dot" />{l.label}
        </button>
      ))}
    </div>
  );
}

const List = ({ items }: { items: string[] }) => <ul className="lx-list">{items.map((p) => <li key={p}>{p}</li>)}</ul>;

export function NodeSheet({ id, onClose, onDomain, onNode }: Props) {
  const links = linksFor(id);
  const by = (...g: LinkGroup[]) => links.filter((l) => g.includes(l.group));
  const pick = (l: LinkTarget) => (DOMAINS_L.some((d) => d.id === l.id) ? onDomain(l.id) : onNode(l.id));
  const root = ROOTS_L.find((r) => r.id === id);
  if (root) return (
    <Sheet key={id} eyebrow="Racine · facteur de contexte" title={root.label} onClose={onClose} testid="node-sheet">
      <p className="lx-intro">{root.intro}</p>
      <Section title="Questions à explorer"><List items={root.questions} /></Section>
      <Section title="Éléments de l'arbre en lien"><Chips items={links} onPick={pick} /></Section>
      <Disclaimer>Les racines représentent des facteurs de contexte à explorer, jamais des causes certaines des difficultés.</Disclaimer>
    </Sheet>
  );
  const node = NODES_L.find((n) => n.id === id)!;
  const frag = node.kind === "fragility";
  return (
    <Sheet key={id} eyebrow={frag ? "Défi · fragilité évolutive" : "Capacité · ressource"} title={node.label} accent={frag ? "#f59aac" : "#f5c46a"} onClose={onClose} testid="node-sheet">
      <p className="lx-intro">{node.intro}</p>
      <Section title={frag ? "Facteurs potentiellement associés" : "Domaines et contexte"} testid="node-factors"><Chips items={by("domain", "root")} onPick={pick} /></Section>
      <Section title={frag ? "Ressources protectrices" : "Peut soutenir face à"} testid="node-resources"><Chips items={by(frag ? "resource" : "challenge")} onPick={pick} /></Section>
      <Section title="Pistes d'accompagnement" testid="node-pistes"><List items={node.pistes} /></Section>
      <Disclaimer>Ces liens sont des pistes d'exploration, pas des diagnostics ni des preuves de causalité.</Disclaimer>
    </Sheet>
  );
}
