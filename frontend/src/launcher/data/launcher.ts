// Données de démonstration ENTIÈREMENT FICTIVES — modifiables librement.
// Les liens sont des pistes d'exploration, jamais des diagnostics ni des causes.

export interface Palette { main: string; light: string; deep: string }
export interface SubBranch { id: string; label: string; note: string }
export interface LDomain { id: string; name: string; palette: Palette; intro: string; subs: SubBranch[]; observation: string }
export interface RootFactor { id: string; label: string; intro: string; questions: string[] }
export interface TreeNode {
  id: string; label: string; kind: "capacity" | "fragility"; intro: string;
  domains: string[]; roots: string[]; resources: string[]; pistes: string[];
}

export const DOMAINS_L: LDomain[] = [
  {
    id: "sante", name: "Santé", palette: { main: "#f2545b", light: "#ff9a8a", deep: "#b3263a" },
    intro: "Sommeil, alimentation, motricité, sensorialité et confort global.",
    observation: "Bâillements fréquents certains lundis matin.",
    subs: [
      { id: "h1", label: "Sommeil", note: "Rythmes et qualité du repos, à explorer avec la famille." },
      { id: "h2", label: "Alimentation", note: "Appétit et confort pendant les repas." },
      { id: "h3", label: "Motricité", note: "Plaisir de courir, grimper, s'équilibrer." },
      { id: "h4", label: "Sensorialité", note: "Sensibilité au bruit, à la lumière, aux textures." },
      { id: "h5", label: "Énergie", note: "Disponibilité au fil de la journée." },
      { id: "h6", label: "Suivi et soins", note: "Professionnels de santé identifiés par la famille." },
    ],
  },
  {
    id: "cognitif", name: "Cognitif", palette: { main: "#3fa9f5", light: "#7fe3ff", deep: "#2257d6" },
    intro: "Attention, mémoire, langage, raisonnement et fonctions exécutives.",
    observation: "Termine seule un puzzle de 60 pièces en 15 minutes.",
    subs: [
      { id: "c1", label: "Attention", note: "Capacité à rester engagé dans une activité." },
      { id: "c2", label: "Mémoire", note: "Retenir des images, des consignes, des trajets." },
      { id: "c3", label: "Langage", note: "Comprendre et se faire comprendre." },
      { id: "c4", label: "Raisonnement", note: "Résoudre, comparer, déduire en manipulant." },
      { id: "c5", label: "Curiosité", note: "Envie de questionner et de découvrir." },
      { id: "c6", label: "Planification", note: "Anticiper les étapes d'une tâche." },
    ],
  },
  {
    id: "autonomie", name: "Autonomie", palette: { main: "#4fd47a", light: "#a8f7c0", deep: "#1f9a4c" },
    intro: "Gestes du quotidien, organisation, initiative et responsabilités.",
    observation: "Distribue spontanément les gobelets au goûter.",
    subs: [
      { id: "u1", label: "Gestes du quotidien", note: "S'habiller, ranger, se préparer." },
      { id: "u2", label: "Organisation", note: "Gérer son matériel et son espace." },
      { id: "u3", label: "Initiative", note: "Proposer, entreprendre, essayer seul." },
      { id: "u4", label: "Responsabilités", note: "Tenir un rôle dans le groupe." },
      { id: "u5", label: "Demander de l'aide", note: "Savoir solliciter l'adulte au bon moment." },
      { id: "u6", label: "Déplacements", note: "Se repérer dans les lieux connus." },
    ],
  },
  {
    id: "emotionnel", name: "Émotionnel", palette: { main: "#f5b942", light: "#ffe08a", deep: "#c97d14" },
    intro: "Reconnaître, exprimer et réguler ses émotions, dans un contexte donné et à un moment donné.",
    observation: "Nomme « colère » spontanément pendant un conflit de jeu.",
    subs: [
      { id: "e1", label: "Reconnaissance des émotions", note: "Identifier ce que l'on ressent et ce que ressentent les autres." },
      { id: "e2", label: "Expression des émotions", note: "Trouver des mots, des gestes ou des dessins pour dire." },
      { id: "e3", label: "Régulation émotionnelle", note: "Retrouver un état de calme après une émotion forte." },
      { id: "e4", label: "Gestion de la frustration", note: "Faire face à l'attente, au refus, à l'imprévu." },
      { id: "e5", label: "Apaisement", note: "Stratégies et lieux qui aident à se poser." },
      { id: "e6", label: "Adulte de confiance", note: "Rechercher un adulte sécurisant quand c'est difficile." },
    ],
  },
  {
    id: "social", name: "Social", palette: { main: "#a46cf5", light: "#d2b0ff", deep: "#6a35c9" },
    intro: "Liens avec les pairs et les adultes, coopération, place dans le groupe.",
    observation: "Invite un camarade à rejoindre son jeu de construction.",
    subs: [
      { id: "s1", label: "Coopération", note: "Partager, attendre son tour, construire ensemble." },
      { id: "s2", label: "Amitiés", note: "Liens privilégiés avec un ou plusieurs pairs." },
      { id: "s3", label: "Place dans le groupe", note: "Se sentir accepté et trouver son rôle." },
      { id: "s4", label: "Empathie", note: "Être attentif à ce que vit l'autre." },
      { id: "s5", label: "Désaccords", note: "Traverser un conflit et trouver une issue." },
      { id: "s6", label: "Lien aux adultes", note: "Communication avec les adultes de l'entourage." },
    ],
  },
  {
    id: "scolaire", name: "Scolaire", palette: { main: "#f58a3f", light: "#ffc08a", deep: "#c4561a" },
    intro: "Rapport aux apprentissages, acquisitions, méthodes et motivation.",
    observation: "Raconte l'histoire du jour en quatre étapes.",
    subs: [
      { id: "a1", label: "Lecture", note: "Entrée dans l'écrit et goût des histoires." },
      { id: "a2", label: "Écriture", note: "Graphisme, tenue du crayon, production." },
      { id: "a3", label: "Mathématiques", note: "Nombres, formes, résolution de problèmes." },
      { id: "a4", label: "Méthodes", note: "S'organiser pour apprendre." },
      { id: "a5", label: "Motivation", note: "Envie d'apprendre et plaisir de réussir." },
      { id: "a6", label: "Rapport à l'erreur", note: "Oser essayer, accepter de se tromper." },
    ],
  },
  {
    id: "environnement", name: "Environnement", palette: { main: "#2dd4bf", light: "#99f6e4", deep: "#0f8f80" },
    intro: "Cadres de vie de l'enfant : famille, école, lieux de loisirs, événements récents.",
    observation: "Parle avec enthousiasme de sa nouvelle chambre.",
    subs: [
      { id: "v1", label: "Cadre familial", note: "Repères et organisation du quotidien." },
      { id: "v2", label: "Cadre scolaire", note: "Stabilité de l'équipe et des lieux." },
      { id: "v3", label: "Loisirs", note: "Activités appréciées en dehors de l'école." },
      { id: "v4", label: "Événements récents", note: "Changements qui méritent d'être situés." },
      { id: "v5", label: "Liens école-famille", note: "Qualité des échanges entre adultes." },
      { id: "v6", label: "Réseau de soutien", note: "Personnes et structures ressources." },
    ],
  },
];

export const ROOTS_L: RootFactor[] = [
  { id: "r-famille", label: "Environnement familial", intro: "Repères, organisation et vie quotidienne à la maison.", questions: ["Quels repères l'enfant identifie-t-il ?", "Y a-t-il eu des changements récents d'organisation ?"] },
  { id: "r-parcours", label: "Parcours de vie", intro: "Événements et transitions qui jalonnent l'histoire de l'enfant.", questions: ["Quelles transitions récentes peuvent être situées ?", "Comment l'enfant en parle-t-il, s'il le souhaite ?"] },
  { id: "r-entourage", label: "Entourage", intro: "Pairs, adultes proches et relations significatives.", questions: ["Qui sont les personnes sur lesquelles il s'appuie ?", "Quelles relations le mettent en confiance ?"] },
  { id: "r-institution", label: "Contexte institutionnel", intro: "École, structure d'accueil, rythmes et équipes.", questions: ["Les rythmes et transitions sont-ils anticipés ?", "L'équipe a-t-elle changé récemment ?"] },
  { id: "r-ressources", label: "Ressources disponibles", intro: "Appuis, lieux, dispositifs et professionnels mobilisables.", questions: ["Quels appuis existent déjà ?", "Lesquels l'enfant choisit-il spontanément ?"] },
];

export const CAPACITIES: TreeNode[] = [
  { id: "k-confiance", kind: "capacity", label: "Confiance en soi", intro: "Ose essayer de nouvelles activités quand l'adulte est proche.", domains: ["emotionnel", "scolaire"], roots: ["r-entourage"], resources: [], pistes: ["Valoriser les essais plus que les résultats", "Proposer des défis à sa portée"] },
  { id: "k-creativite", kind: "capacity", label: "Créativité", intro: "Invente des histoires et dessine avec beaucoup de détails.", domains: ["cognitif", "emotionnel"], roots: ["r-ressources"], resources: [], pistes: ["Utiliser le dessin pour exprimer ce qui est vécu", "Ateliers d'invention d'histoires"] },
  { id: "k-communication", kind: "capacity", label: "Communication", intro: "S'exprime volontiers en petit groupe.", domains: ["social", "cognitif"], roots: ["r-entourage"], resources: [], pistes: ["Temps de parole en petit groupe", "Supports visuels pour structurer le récit"] },
  { id: "k-relations", kind: "capacity", label: "Relations de confiance", intro: "Lien stable avec son adulte référent et un camarade.", domains: ["social", "emotionnel"], roots: ["r-entourage", "r-institution"], resources: [], pistes: ["Préserver la continuité de l'adulte référent", "Appui sur le pair-relais"] },
  { id: "k-autonomie", kind: "capacity", label: "Autonomie", intro: "Prend des initiatives pour aider le groupe.", domains: ["autonomie"], roots: ["r-famille"], resources: [], pistes: ["Confier une responsabilité hebdomadaire", "Check-list illustrée des étapes"] },
  { id: "k-aide", kind: "capacity", label: "Demander de l'aide", intro: "Sollicite l'adulte quand une situation devient difficile.", domains: ["autonomie", "emotionnel"], roots: ["r-ressources"], resources: [], pistes: ["Signal convenu pour demander de l'aide", "Reconnaître et nommer cette démarche"] },
];

export const FRAGILITIES_L: TreeNode[] = [
  { id: "d-anxiete", kind: "fragility", label: "Anxiété observée", intro: "Inquiétudes observées lors de situations nouvelles, à ce jour.", domains: ["emotionnel", "social", "sante"], roots: ["r-famille", "r-parcours", "r-institution"], resources: ["k-relations", "k-aide"], pistes: ["Annoncer les transitions avec un support visuel", "Rituel d'accueil stable", "Échanger avec la famille sur les repères du quotidien"] },
  { id: "d-impulsivite", kind: "fragility", label: "Impulsivité", intro: "Réactions rapides observées pendant les jeux collectifs.", domains: ["social", "emotionnel"], roots: ["r-entourage", "r-institution"], resources: ["k-communication", "k-autonomie"], pistes: ["Rôles définis dans le jeu", "Signal visuel de départ"] },
  { id: "d-concentration", kind: "fragility", label: "Difficultés de concentration", intro: "Attention fluctuante sur les consignes orales longues.", domains: ["cognitif", "scolaire", "sante"], roots: ["r-institution"], resources: ["k-creativite", "k-confiance"], pistes: ["Consignes fractionnées avec pictogrammes", "Pauses actives courtes"] },
  { id: "d-sommeil", kind: "fragility", label: "Sommeil perturbé", intro: "Fatigue observée certains matins ; à explorer avec la famille.", domains: ["sante", "cognitif"], roots: ["r-famille", "r-parcours"], resources: ["k-relations"], pistes: ["Échange bienveillant sur les rythmes", "Temps calme en fin de matinée"] },
  { id: "d-regulation", kind: "fragility", label: "Régulation émotionnelle", intro: "Frustration intense lors d'imprévus, apaisée avec l'adulte.", domains: ["emotionnel", "autonomie"], roots: ["r-entourage", "r-institution"], resources: ["k-aide", "k-creativite"], pistes: ["Coin calme identifié", "Roue des émotions", "Respiration courte guidée"] },
  { id: "d-conflits", kind: "fragility", label: "Gestion des conflits", intro: "Désaccords dans certains jeux, avec recours possible à la médiation.", domains: ["social", "emotionnel"], roots: ["r-entourage"], resources: ["k-communication", "k-relations"], pistes: ["Reformuler les besoins de chacun", "Médiation adulte et jeux coopératifs"] },
];

export const NODES_L = [...CAPACITIES, ...FRAGILITIES_L];

export const DEMO_PROFILE = {
  name: "Lou",
  age: "7 ans · CE1",
  note: "Profil entièrement fictif, créé pour la démonstration.",
  capacities: ["Créativité", "Relations de confiance", "Curiosité", "Demander de l'aide"],
  observations: [
    { date: "12/09", text: "Pleurs à l'arrivée, apaisés en 5 minutes avec le rituel du dessin." },
    { date: "03/10", text: "Nomme « colère » spontanément pendant un conflit de jeu." },
    { date: "08/10", text: "Termine seule un puzzle de 60 pièces." },
  ],
  goals: ["Anticiper les transitions avec un support visuel", "Renforcer l'expression des émotions", "Proposer des jeux coopératifs en binôme"],
};
