// Données FICTIVES — nœuds de fragilité. Les liens indiquent des relations
// possibles à examiner, jamais une causalité démontrée.

export interface Fragility {
  id: string;
  label: string;
  intro: string;
  /** Domaines avec lesquels une relation est possible. */
  domains: string[];
  /** Contextes (racines) pertinents. */
  contexts: string[];
  observations: { date: string; text: string }[];
  hypotheses: string[];
  interventions: string[];
}

export const FRAGILITIES: Fragility[] = [
  {
    id: "f-anxiete",
    label: "Anxiété",
    intro: "Inquiétudes observées dans certaines situations nouvelles, à ce jour.",
    domains: ["emotionnel", "social"],
    contexts: ["Environnement familial", "Contexte institutionnel"],
    observations: [
      { date: "12/09/2026", text: "Demande plusieurs fois si sa mère viendra le chercher." },
      { date: "29/09/2026", text: "Ventre serré signalé avant la sortie à la médiathèque." },
    ],
    hypotheses: ["Les changements d'adulte référent pourraient-ils jouer un rôle ?", "Le manque d'anticipation des sorties est-il en jeu ?"],
    interventions: ["Annoncer les sorties la veille avec un support visuel", "Rituel d'accueil stable"],
  },
  {
    id: "f-impulsivite",
    label: "Impulsivité",
    intro: "Réactions rapides observées lors des jeux collectifs, ces dernières semaines.",
    domains: ["social", "emotionnel"],
    contexts: ["Entourage"],
    observations: [{ date: "20/09/2026", text: "Prend le ballon avant la fin de la consigne, puis s'excuse." }],
    hypotheses: ["L'attente prolongée en grand groupe pourrait-elle être difficile ?"],
    interventions: ["Rôles définis dans le jeu", "Signal visuel de départ"],
  },
  {
    id: "f-concentration",
    label: "Difficultés de concentration",
    intro: "Attention fluctuante sur les consignes orales longues, en ce moment.",
    domains: ["cognitif", "scolaire"],
    contexts: ["Contexte institutionnel", "Ressources disponibles"],
    observations: [{ date: "28/09/2026", text: "Décroche après ~10 min d'écoute, reprend avec un support imagé." }],
    hypotheses: ["La fatigue matinale pourrait-elle contribuer ?", "Le format oral seul est-il adapté ?"],
    interventions: ["Consignes fractionnées avec pictogrammes", "Pauses actives courtes"],
  },
  {
    id: "f-sommeil",
    label: "Sommeil",
    intro: "Fatigue observée certains matins ; la situation est à explorer avec la famille.",
    domains: ["sante", "cognitif"],
    contexts: ["Environnement familial", "Parcours de vie"],
    observations: [{ date: "15/09/2026", text: "Bâillements fréquents le lundi matin." }],
    hypotheses: ["Les rythmes liés à la garde alternée pourraient-ils jouer ?"],
    interventions: ["Échange bienveillant avec la famille sur les rythmes", "Temps calme proposé en fin de matinée"],
  },
  {
    id: "f-regulation",
    label: "Régulation émotionnelle",
    intro: "Frustration intense observée lors d'imprévus, avec un apaisement possible grâce à l'adulte.",
    domains: ["emotionnel", "autonomie"],
    contexts: ["Entourage", "Contexte institutionnel"],
    observations: [{ date: "03/10/2026", text: "Refus de 8 min lors d'une transition, apaisé avec le coin calme." }],
    hypotheses: ["L'anticipation des transitions pourrait-elle aider ?", "Le vocabulaire émotionnel est-il disponible dans l'instant ?"],
    interventions: ["Coin calme identifié", "Roue des émotions", "Exercices de respiration courts"],
  },
  {
    id: "f-conflits", label: "Gestion des conflits",
    intro: "Désaccords observés dans certains jeux collectifs, avec un recours à la médiation possible.",
    domains: ["social", "emotionnel"], contexts: ["Entourage", "Contexte institutionnel"],
    observations: [{ date: "06/10/2026", text: "Lors d'un désaccord sur les règles, Léo sollicite l'adulte après deux minutes." }],
    hypotheses: ["Des règles explicites et une médiation pourraient-elles soutenir le dialogue ?"],
    interventions: ["Reformuler les besoins de chacun", "Proposer une médiation adulte et des jeux coopératifs"],
  },
];
