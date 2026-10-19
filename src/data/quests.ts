// Données FICTIVES — parcours d'accompagnement. Aucun score, aucun classement,
// aucune trajectoire présentée comme certaine.

export interface QuestStep {
  title: string;
  objective: string;
  action: string;
  resource: string;
  indicator: string;
  status: "fait" | "en cours" | "à venir";
}

export interface Quest {
  id: string;
  title: string;
  domainId: string;
  steps: QuestStep[];
}

export const QUESTS: Quest[] = [
  {
    id: "q-transitions",
    title: "Traverser les transitions plus sereinement",
    domainId: "emotionnel",
    steps: [
      { title: "Observer", objective: "Repérer les moments de transition difficiles", action: "Noter durée et contexte pendant 2 semaines", resource: "Grille d'observation simple", indicator: "Nombre de situations décrites", status: "fait" },
      { title: "Anticiper", objective: "Rendre la transition prévisible", action: "Annonce 2 min avant + minuteur visuel", resource: "Emploi du temps illustré", indicator: "Durée du refus lors des transitions", status: "en cours" },
      { title: "S'apaiser", objective: "Disposer d'un moyen d'apaisement", action: "Présenter le coin calme et la roue des émotions", resource: "Coin calme identifié", indicator: "Utilisation spontanée du coin calme", status: "à venir" },
      { title: "Faire le point", objective: "Partager les constats avec la famille", action: "Échange en fin de période", resource: "Synthèse des observations", indicator: "Points d'accord sur les repères", status: "à venir" },
    ],
  },
  {
    id: "q-attention",
    title: "Soutenir l'attention en atelier",
    domainId: "cognitif",
    steps: [
      { title: "Fractionner", objective: "Consignes plus courtes", action: "Une étape à la fois, avec pictogramme", resource: "Banque de pictogrammes", indicator: "Étapes réalisées sans relance", status: "en cours" },
      { title: "Bouger", objective: "Alterner calme et mouvement", action: "Pause active de 2 min toutes les 10 min", resource: "Fiches de pauses actives", indicator: "Reprise de l'activité après la pause", status: "à venir" },
    ],
  },
];
