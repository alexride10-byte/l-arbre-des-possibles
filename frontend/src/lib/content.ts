import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";

export type ContentKind = "domain" | "fragility";
export interface ContentDoc { kind: ContentKind; item_id: string; data: Record<string, unknown>; updated_at?: string; updated_by?: string }

export const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const DEFAULTS = { domain: clone(DOMAINS), fragility: clone(FRAGILITIES) };
const list = (k: ContentKind) => (k === "domain" ? DOMAINS : FRAGILITIES) as unknown as { id: string }[];

export const defaultOf = (k: ContentKind, id: string) => clone((DEFAULTS[k] as { id: string }[]).find((x) => x.id === id)!);

// Les contenus modifiés par l'admin remplacent les textes par défaut, sur place.
export function applyContent(k: ContentKind, id: string, data: Record<string, unknown> | null) {
  const target = list(k).find((x) => x.id === id);
  if (target) Object.assign(target, data ?? defaultOf(k, id));
}

export const applyAll = (docs: ContentDoc[]) => docs.forEach((d) => applyContent(d.kind, d.item_id, d.data));
