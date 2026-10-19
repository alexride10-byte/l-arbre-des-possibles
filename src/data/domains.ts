// Données FICTIVES — aucune donnée réelle d'enfant.
export type NodeKind = "ressource" | "competence" | "difficulte" | "besoin";

export interface SubNode {
  id: string;
  label: string;
  kind: NodeKind;
  note: string;
}

export interface ExampleSheet {
  title: string;
  date: string;
  observation: string; // fait observé
  context: string;
  existingResources: string[];
  hypotheses: string[]; // à examiner, non affirmées
  pistes: string[]; // recommandations
  indicators: string[];
}

export interface Domain {
  id: string;
  name: string;
  hue: number; // teinte oklch
  intro: string;
  nodes: SubNode[];
  strengths: string[];
  fragilities: string[];
  observations: { date: string; text: string }[];
  pistes: string[];
  resources: string[];
  sheet?: ExampleSheet;
}

export const KIND_LABEL: Record<NodeKind, string> = {
  ressource: "Ressource",
  competence: "Compétence",
  difficulte: "Difficulté observée",
  besoin: "Besoin éventuel",
};

export const ROOTS = [
  "Environnement familial",
  "Parcours de vie",
  "Entourage",
  "Contexte institutionnel",
  "Ressources disponibles",
];

export const DOMAINS: Domain[] = [
  {
    id: "emotionnel",
    name: "Émotionnel",
    hue: 200,
    intro:
      "Reconnaissance, expression et régulation des émotions, dans un contexte donné et à un moment donné.",
    nodes: [
      { id: "e1", label: "Nommer ses émotions", kind: "competence", note: "Utilise un vocabulaire émotionnel varié en petit groupe." },
      { id: "e2", label: "Adulte refuge", kind: "ressource", note: "Lien sécurisant avec l'éducatrice référente." },
      { id: "e3", label: "Transitions", kind: "difficulte", note: "Tension observée lors des changements d'activité, actuellement." },
      { id: "e4", label: "Repères anticipés", kind: "besoin", note: "Pourrait bénéficier d'annonces préalables." },
    ],
    strengths: ["Exprime sa joie avec spontanéité", "Sollicite l'adulte quand il est en difficulté"],
    fragilities: ["Frustration intense observée lors d'imprévus, ces dernières semaines"],
    observations: [
      { date: "12/09/2026", text: "Pleurs à l'arrivée, apaisés en 5 min avec le rituel du dessin." },
      { date: "03/10/2026", text: "Nomme « colère » spontanément pendant un conflit de jeu." },
    ],
    pistes: ["Mettre en place un emploi du temps visuel", "Proposer un coin calme identifié"],
    resources: ["Programme de compétences psychosociales (Santé publique France)"],
    sheet: {
      title: "Changements d'activité",
      date: "03/10/2026",
      observation:
        "Lors du passage de la récréation à l'atelier, l'enfant s'assoit au sol et refuse de rejoindre le groupe pendant environ 8 minutes.",
      context: "Lundi matin, après un week-end en garde alternée. Remplaçante présente ce jour-là.",
      existingResources: ["Accepte l'aide de son adulte référent", "Apprécie les supports visuels", "Bonne relation avec un pair"],
      hypotheses: [
        "Le changement d'adulte a-t-il pu majorer l'insécurité ?",
        "Le manque d'anticipation de la transition joue-t-il un rôle ?",
      ],
      pistes: ["Annoncer la transition 2 min avant", "Associer un pair-relais", "Faire le point avec la famille sur les rythmes"],
      indicators: ["Durée du refus", "Nombre de transitions sans aide", "Auto-expression de l'émotion"],
    },
  },
  {
    id: "social",
    name: "Social et relationnel",
    hue: 175,
    intro: "Qualité des liens avec les pairs et les adultes, coopération, place dans le groupe.",
    nodes: [
      { id: "s1", label: "Coopération", kind: "competence", note: "Partage le matériel en atelier dirigé." },
      { id: "s2", label: "Ami privilégié", kind: "ressource", note: "Relation stable avec un camarade." },
      { id: "s3", label: "Grand groupe", kind: "difficulte", note: "Retrait observé en contexte bruyant." },
      { id: "s4", label: "Médiation", kind: "besoin", note: "Accompagnement des conflits par l'adulte." },
    ],
    strengths: ["Attentif aux plus jeunes", "Respecte les tours de parole en petit groupe"],
    fragilities: ["Se tient à l'écart des jeux collectifs en ce moment"],
    observations: [{ date: "20/09/2026", text: "Invite un camarade à rejoindre son jeu de construction." }],
    pistes: ["Jeux coopératifs en binômes", "Responsabilités valorisantes dans le groupe"],
    resources: ["Ressources sur la médiation par les pairs (Éduscol)"],
  },
  {
    id: "cognitif",
    name: "Cognitif",
    hue: 85,
    intro: "Attention, mémoire, raisonnement, langage et fonctions exécutives.",
    nodes: [
      { id: "c1", label: "Curiosité", kind: "competence", note: "Pose de nombreuses questions sur la nature." },
      { id: "c2", label: "Mémoire visuelle", kind: "ressource", note: "Retient bien les images et les trajets." },
      { id: "c3", label: "Attention soutenue", kind: "difficulte", note: "Décroche après ~10 min en activité orale." },
      { id: "c4", label: "Fractionner", kind: "besoin", note: "Consignes courtes et séquencées." },
    ],
    strengths: ["Résout des puzzles complexes", "Raisonnement logique en manipulation"],
    fragilities: ["Attention fluctuante sur les consignes orales longues"],
    observations: [{ date: "28/09/2026", text: "Termine seul un puzzle de 60 pièces en 15 min." }],
    pistes: ["Appuyer les consignes par des pictogrammes", "Alterner temps actifs et temps calmes"],
    resources: [],
  },
  {
    id: "scolaire",
    name: "Scolaire et apprentissages",
    hue: 55,
    intro: "Rapport aux apprentissages, acquisitions, méthodes et motivation.",
    nodes: [
      { id: "a1", label: "Numération", kind: "competence", note: "Dénombre jusqu'à 20 avec aisance." },
      { id: "a2", label: "Goût des histoires", kind: "ressource", note: "Très engagé lors des lectures." },
      { id: "a3", label: "Graphisme", kind: "difficulte", note: "Tenue du crayon encore en évolution." },
      { id: "a4", label: "Valorisation", kind: "besoin", note: "Retours positifs sur les progrès." },
    ],
    strengths: ["Mobilise ses connaissances à l'oral"],
    fragilities: ["Fatigabilité observée lors des tâches écrites"],
    observations: [{ date: "05/10/2026", text: "Raconte l'histoire du jour avec 4 étapes chronologiques." }],
    pistes: ["Supports d'écriture adaptés", "Partir des centres d'intérêt"],
    resources: ["Programmes cycle 1 et 2 (Éduscol)"],
  },
  {
    id: "sante",
    name: "Santé et bien-être",
    hue: 150,
    intro: "Sommeil, alimentation, motricité, sensorialité et confort global.",
    nodes: [
      { id: "h1", label: "Motricité globale", kind: "competence", note: "Aime courir, grimper, s'équilibrer." },
      { id: "h2", label: "Suivi médical", kind: "ressource", note: "Médecin traitant identifié par la famille." },
      { id: "h3", label: "Fatigue matinale", kind: "difficulte", note: "Bâillements fréquents certains matins." },
      { id: "h4", label: "Temps de repos", kind: "besoin", note: "Moments calmes dans la journée." },
    ],
    strengths: ["Plaisir dans les activités physiques"],
    fragilities: ["Sensibilité au bruit observée en cantine"],
    observations: [{ date: "15/09/2026", text: "Se bouche les oreilles au réfectoire, mange peu." }],
    pistes: ["Proposer un casque anti-bruit à essayer", "Échanger avec la famille sur le sommeil"],
    resources: ["Repères de santé de l'enfant (carnet de santé)"],
  },
  {
    id: "autonomie",
    name: "Autonomie et vie quotidienne",
    hue: 30,
    intro: "Gestes du quotidien, organisation, initiative et prise de responsabilités.",
    nodes: [
      { id: "u1", label: "Habillage", kind: "competence", note: "Met son manteau seul." },
      { id: "u2", label: "Routines", kind: "ressource", note: "Repères stables à la maison et en classe." },
      { id: "u3", label: "Rangement", kind: "difficulte", note: "Oublis fréquents du matériel, en ce moment." },
      { id: "u4", label: "Étayage visuel", kind: "besoin", note: "Listes illustrées des étapes." },
    ],
    strengths: ["Prend des initiatives pour aider"],
    fragilities: ["Organisation du matériel encore à étayer"],
    observations: [{ date: "01/10/2026", text: "Distribue spontanément les gobelets au goûter." }],
    pistes: ["Responsabilité hebdomadaire", "Check-list illustrée du cartable"],
    resources: [],
  },
];
