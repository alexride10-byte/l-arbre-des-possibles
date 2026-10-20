import type { Child, Observation, StepStatus } from "./api";
import { DOMAINS } from "@/data/domains";
import { QUESTS } from "@/data/quests";

export type ScenarioId = "actuel" | "interventions" | "stable" | "risque";

export const XP_PER_LEVEL = 200;
export const xpLevel = (xp: number) => ({ level: Math.floor(xp / XP_PER_LEVEL) + 1, progress: (xp % XP_PER_LEVEL) / XP_PER_LEVEL, toNext: XP_PER_LEVEL - (xp % XP_PER_LEVEL) });

export const stepStatus = (child: Child, questId: string, idx: number, fallback: StepStatus): StepStatus =>
  child.quest_steps[`${questId}:${idx}`]?.status ?? fallback;

export const doneSteps = (child: Child) =>
  QUESTS.reduce((n, q) => n + q.steps.filter((s, i) => stepStatus(child, q.id, i, s.status) === "fait").length, 0);

export const SCENARIOS: { id: ScenarioId; label: string; color: string }[] = [
  { id: "actuel", label: "Scénario actuel", color: "#60a5fa" },
  { id: "interventions", label: "Avec interventions", color: "#4ade80" },
  { id: "stable", label: "Sans changement", color: "#fbbf24" },
  { id: "risque", label: "Scénario à risque", color: "#f87171" },
];

export const HORIZONS = [
  { t: 0, label: "Aujourd'hui" }, { t: 0.25, label: "3 mois" }, { t: 0.5, label: "6 mois" },
  { t: 1, label: "1 an" }, { t: 2, label: "2 ans" }, { t: 3, label: "3 ans" }, { t: 5, label: "5 ans" },
];

const rate = (s: ScenarioId, momentum: number) =>
  ({ interventions: 0.5, actuel: 0.1 + Math.min(0.3, momentum * 0.04), stable: 0.01, risque: -0.28 })[s];

export function project(level: number, k: number, t: number) {
  return k >= 0 ? level + (5 - level) * (1 - Math.exp(-k * t)) : level - (level - 1) * (1 - Math.exp(k * t));
}

export function projectedLevels(levels: Record<string, number>, s: ScenarioId, t: number, momentum: number) {
  return Object.fromEntries(DOMAINS.map((d) => [d.id, Math.round(project(levels[d.id] ?? 1, rate(s, momentum), t) * 10) / 10]));
}

export function chartData(levels: Record<string, number>, momentum: number) {
  return HORIZONS.map((h) => {
    const row: Record<string, number | string> = { label: h.label };
    for (const s of SCENARIOS) {
      const p = projectedLevels(levels, s.id, h.t, momentum);
      row[s.id] = Math.round((Object.values(p).reduce((a, b) => a + b, 0) / DOMAINS.length) * 20);
    }
    return row;
  });
}

const OUTCOMES: Record<string, [string, string]> = {
  emotionnel: ["Meilleure régulation émotionnelle", "Émotions plus difficiles à apaiser"],
  social: ["Relations sociales plus stables", "Risque d'isolement dans le groupe"],
  cognitif: ["Attention et raisonnement consolidés", "Attention qui s'essouffle"],
  scolaire: ["Progression scolaire", "Décrochage possible à l'écrit"],
  sante: ["Rythmes et bien-être plus réguliers", "Fatigue qui s'installe"],
  autonomie: ["Plus grande autonomie", "Dépendance à l'adulte"],
  environnement: ["Liens école-famille renforcés", "Repères familiaux fragilisés"],
};

export function futureOutcomes(levels: Record<string, number>, s: ScenarioId, momentum: number) {
  const p = projectedLevels(levels, s, 5, momentum);
  const diffs = DOMAINS.map((d) => ({ id: d.id, from: levels[d.id] ?? 1, to: p[d.id] ?? 1 }));
  const sorted = [...diffs].sort((a, b) => (s === "risque" ? a.to - a.from - (b.to - b.from) : b.to - b.from - (a.to - a.from)));
  return sorted.slice(0, 4).map((x) => ({ ...x, text: s === "stable" ? `Stable : ${DOMAINS.find((d) => d.id === x.id)?.name}` : OUTCOMES[x.id]?.[s === "risque" ? 1 : 0] ?? x.id }));
}

export interface Badge { id: string; label: string; desc: string; earned: boolean }

export function badges(child: Child, obs: Observation[]): Badge[] {
  const done = doneSteps(child);
  const questDone = QUESTS.some((q) => q.steps.every((s, i) => stepStatus(child, q.id, i, s.status) === "fait"));
  const lv = Object.values(child.levels);
  return [
    { id: "premiers-pas", label: "Premiers pas", desc: "Enregistrer une première observation", earned: obs.length >= 1 },
    { id: "observateur", label: "Observateur attentif", desc: "10 observations enregistrées", earned: obs.length >= 10 },
    { id: "premiere-quete", label: "Quête accomplie", desc: "Terminer un parcours complet", earned: questDone },
    { id: "perseverance", label: "Persévérance", desc: "5 étapes d'accompagnement réalisées", earned: done >= 5 },
    { id: "equilibre", label: "Équilibre", desc: "Tous les domaines au niveau 3 ou plus", earned: lv.every((l) => l >= 3) },
    { id: "epanouissement", label: "Épanouissement", desc: "Un domaine au niveau 5", earned: lv.some((l) => l >= 5) },
    { id: "explorateur", label: "Explorateur", desc: "3 réévaluations de niveau", earned: child.level_history.length >= 3 },
  ];
}
