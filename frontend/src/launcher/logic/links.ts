import { CAPACITIES, DOMAINS_L, FRAGILITIES_L, NODES_L, ROOTS_L } from "../data/launcher";

export type LinkGroup = "domain" | "root" | "resource" | "challenge";
export interface LinkTarget { id: string; label: string; group: LinkGroup; color: string }

const COLORS: Record<LinkGroup, string> = { domain: "", root: "#e9c27a", resource: "#fde68a", challenge: "#ff9aa8" };

const domainT = (id: string): LinkTarget => {
  const d = DOMAINS_L.find((x) => x.id === id)!;
  return { id, label: d.name, group: "domain", color: d.palette.main };
};
const rootT = (id: string): LinkTarget => ({ id, label: ROOTS_L.find((r) => r.id === id)!.label, group: "root", color: COLORS.root });
const nodeT = (id: string, group: LinkGroup): LinkTarget => ({ id, label: NODES_L.find((n) => n.id === id)!.label, group, color: COLORS[group] });

// Relations possibles à explorer, jamais des causes.
export function linksFor(id: string): LinkTarget[] {
  const root = ROOTS_L.find((r) => r.id === id);
  if (root) return [
    ...FRAGILITIES_L.filter((n) => n.roots.includes(id)).map((n) => nodeT(n.id, "challenge")),
    ...CAPACITIES.filter((n) => n.roots.includes(id)).map((n) => nodeT(n.id, "resource")),
  ];
  const node = NODES_L.find((n) => n.id === id);
  if (!node) return [];
  const base = [...node.domains.map(domainT), ...node.roots.map(rootT)];
  if (node.kind === "fragility") return [...base, ...node.resources.map((r) => nodeT(r, "resource"))];
  return [...base, ...FRAGILITIES_L.filter((f) => f.resources.includes(id)).map((f) => nodeT(f.id, "challenge"))];
}
