import { DOMAINS, ROOTS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { FACTORS } from "@/data/factors";

export type ContentKind = "domain" | "fragility" | "factor" | "roots";
export interface ContentDoc { kind: ContentKind; item_id: string; data: Record<string, unknown>; updated_at?: string; updated_by?: string }

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const DEFAULTS = { domain: clone(DOMAINS), fragility: clone(FRAGILITIES), factor: clone(FACTORS), roots: [{ id: "all", labels: clone(ROOTS) }] };
const DEFAULT_CTX = { frag: FRAGILITIES.map((f) => [...f.contexts]), factor: FACTORS.map((f) => f.context) };
const list = (k: ContentKind) => (k === "domain" ? DOMAINS : k === "fragility" ? FRAGILITIES : FACTORS) as unknown as { id: string }[];

export const defaultOf = (k: ContentKind, id: string) => clone((DEFAULTS[k] as { id: string }[]).find((x) => x.id === id)!);

// Renommer une racine met aussi à jour les contextes qui la citent.
function applyRoots(labels: string[]) {
  const rename = (c: string) => { const i = DEFAULTS.roots[0].labels.indexOf(c); return i >= 0 ? labels[i] : c; };
  ROOTS.splice(0, ROOTS.length, ...labels);
  FRAGILITIES.forEach((f, i) => { f.contexts = DEFAULT_CTX.frag[i].map(rename); });
  FACTORS.forEach((f, i) => { f.context = rename(DEFAULT_CTX.factor[i]); });
}

// Les contenus modifiés par l'admin remplacent les textes par défaut, sur place.
export function applyContent(k: ContentKind, id: string, data: Record<string, unknown> | null) {
  if (k === "roots") return applyRoots((data?.labels as string[]) ?? DEFAULTS.roots[0].labels);
  const target = list(k).find((x) => x.id === id);
  if (target) Object.assign(target, data ?? defaultOf(k, id));
}

export const applyAll = (docs: ContentDoc[]) => docs.forEach((d) => applyContent(d.kind, d.item_id, d.data));
