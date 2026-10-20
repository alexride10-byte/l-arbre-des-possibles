// Données FICTIVES — parcours d'accompagnement (« quêtes »). Aucune trajectoire présentée comme certaine.

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
  term: string;
  steps: QuestStep[];
}

export const QUESTS: Quest[] = [
  {
    id: "q-transitions", title: "Traverser les transitions plus sereinement", domainId: "emotionnel", term: "Court terme (2–4 semaines)",
    steps: [
      { title: "Observer", objective: "Repérer les moments de transition difficiles", action: "Noter durée et contexte pendant 2 semaines", resource: "Grille d'observation simple", indicator: "Nombre de situations décrites", status: "fait" },
      { title: "Anticiper", objective: "Rendre la transition prévisible", action: "Annonce 2 min avant + minuteur visuel", resource: "Emploi du temps illustré", indicator: "Durée du refus lors des transitions", status: "en cours" },
      { title: "S'apaiser", objective: "Disposer d'un moyen d'apaisement", action: "Présenter le coin calme et la roue des émotions", resource: "Coin calme identifié", indicator: "Utilisation spontanée du coin calme", status: "à venir" },
      { title: "Faire le point", objective: "Partager les constats avec la famille", action: "Échange en fin de période", resource: "Synthèse des observations", indicator: "Points d'accord sur les repères", status: "à venir" },
    ],
  },
  {
    id: "q-respiration", title: "Exercices de respiration", domainId: "emotionnel", term: "Court terme (2–4 semaines)",
    steps: [
      { title: "Découvrir", objective: "Présenter 2 techniques ludiques", action: "Respiration du ballon, de la fleur", resource: "Cartes illustrées", indicator: "Technique choisie par l'enfant", status: "à venir" },
      { title: "Pratiquer", objective: "Ritualiser le geste", action: "3 respirations après la récréation", resource: "Minuteur visuel", indicator: "Utilisation sans rappel", status: "à venir" },
    ],
  },
  {
    id: "q-attention", title: "Soutenir l'attention en atelier", domainId: "cognitif", term: "Moyen terme (1–3 mois)",
    steps: [
      { title: "Fractionner", objective: "Consignes plus courtes", action: "Une étape à la fois, avec pictogramme", resource: "Banque de pictogrammes", indicator: "Étapes réalisées sans relance", status: "en cours" },
      { title: "Bouger", objective: "Alterner calme et mouvement", action: "Pause active de 2 min toutes les 10 min", resource: "Fiches de pauses actives", indicator: "Reprise de l'activité après la pause", status: "à venir" },
    ],
  },
  {
    id: "q-cooperation", title: "Jouer et coopérer en binôme", domainId: "social", term: "Moyen terme (1–3 mois)",
    steps: [
      { title: "Binôme", objective: "S'appuyer sur un pair connu", action: "Jeux coopératifs à deux, 2 fois par semaine", resource: "Jeux coopératifs", indicator: "Initiatives de contact", status: "en cours" },
      { title: "Petit groupe", objective: "Élargir à 3–4 enfants", action: "Rôles définis dans le jeu", resource: "Cartes de rôles", indicator: "Participation sans retrait", status: "à venir" },
      { title: "Médiation", objective: "Dénouer les conflits", action: "Message clair et reformulation des besoins", resource: "Affiche des étapes de médiation", indicator: "Conflits résolus avec peu d'aide", status: "à venir" },
    ],
  },
  {
    id: "q-ecriture", title: "Redonner le goût de l'écrit", domainId: "scolaire", term: "Moyen terme (1–3 mois)",
    steps: [
      { title: "Adapter", objective: "Limiter la fatigue graphique", action: "Supports lignés adaptés, crayon ergonomique", resource: "Matériel adapté", indicator: "Durée d'écriture sans plainte", status: "à venir" },
      { title: "Valoriser", objective: "Rendre visibles les progrès", action: "Carnet de réussites hebdomadaire", resource: "Carnet de réussites", indicator: "Progrès nommés par l'enfant", status: "à venir" },
    ],
  },
  {
    id: "q-sommeil", title: "Prendre soin des rythmes", domainId: "sante", term: "Moyen terme (1–3 mois)",
    steps: [
      { title: "Échanger", objective: "Comprendre les rythmes avec la famille", action: "Entretien bienveillant, sans jugement", resource: "Repères sommeil (carnet de santé)", indicator: "Repères partagés", status: "à venir" },
      { title: "Apaiser", objective: "Temps calme en journée", action: "10 min de repos en fin de matinée", resource: "Espace calme", indicator: "Signes de fatigue observés", status: "à venir" },
    ],
  },
  {
    id: "q-autonomie", title: "Mon cartable, mes responsabilités", domainId: "autonomie", term: "Court terme (2–4 semaines)",
    steps: [
      { title: "Check-list", objective: "Visualiser les étapes", action: "Liste illustrée du cartable", resource: "Pictogrammes", indicator: "Oublis par semaine", status: "en cours" },
      { title: "Responsabilité", objective: "Valoriser l'initiative", action: "Mission hebdomadaire dans la classe", resource: "Tableau des missions", indicator: "Mission réalisée sans rappel", status: "à venir" },
    ],
  },
  {
    id: "q-liaison", title: "Renforcer le lien école-famille", domainId: "environnement", term: "Long terme (3–6 mois)",
    steps: [
      { title: "Cahier de liaison", objective: "Partager les réussites", action: "Cahier illustré hebdomadaire", resource: "Cahier de liaison", indicator: "Retours de la famille", status: "à venir" },
      { title: "Rencontre", objective: "Coordonner les repères", action: "Rencontre trimestrielle", resource: "Synthèse Enfance+", indicator: "Accords sur les repères", status: "à venir" },
    ],
  },
];
