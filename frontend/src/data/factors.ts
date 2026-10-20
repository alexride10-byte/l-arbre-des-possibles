// All examples are fictional. A relation is an examination prompt, never proof.
export interface Factor {
  id: string;
  label: string;
  domainId: string;
  context: string;
  fragilities: string[];
  description: string;
  facts: string[];
  reported: string[];
  hypotheses: string[];
  unknown: string[];
  resources: string[];
  actions: string[];
  indicators: string[];
}

export const FACTORS: Factor[] = [
  {
    id: "famille", label: "Contexte familial", domainId: "environnement", context: "Environnement familial",
    fragilities: ["f-anxiete", "f-sommeil", "f-regulation"],
    description: "Explorer les repères et les changements du quotidien, sans jugement sur la famille.",
    facts: ["12/09/2026 — À l'accueil, Léo demande trois fois quel adulte viendra le chercher."],
    reported: ["12/09/2026 — Léo dit : « Je ne sais pas qui vient ce soir. » Propos fictifs consignés sans interprétation."],
    hypotheses: ["L'incertitude sur le retour pourrait-elle contribuer à l'inquiétude ?"],
    unknown: ["Ce que l'enfant avait compris de l'organisation du soir.", "Les éventuelles difficultés vécues hors de l'école ne sont pas documentées."],
    resources: ["Un adulte référent accepté par Léo", "Famille disponible pour un échange"],
    actions: ["Clarifier avec la famille les repères utiles à l'enfant.", "Si des propos ou faits font suspecter des violences, privilégier la sécurité, consigner fidèlement les éléments et appliquer les protocoles professionnels de protection de l'enfance ; en danger immédiat, contacter les secours."],
    indicators: ["Demandes de réassurance à l'accueil", "Capacité à identifier l'adulte attendu"],
  },
  {
    id: "relations", label: "Relations avec les autres", domainId: "social", context: "Entourage",
    fragilities: ["f-anxiete", "f-impulsivite", "f-regulation", "f-conflits"],
    description: "Considérer les liens avec les pairs et les adultes, et les conditions de participation au groupe.",
    facts: ["20/09/2026 — Léo invite un camarade dans son jeu de construction."], reported: [],
    hypotheses: ["Un binôme connu faciliterait-il la participation dans un groupe nouveau ?"],
    unknown: ["Le ressenti de Léo dans les différents groupes."],
    resources: ["Un camarade privilégié", "Capacité à coopérer en atelier"],
    actions: ["Proposer un jeu coopératif en binôme", "Prévoir une médiation adulte lors des conflits"],
    indicators: ["Initiatives de contact", "Demandes d'aide pendant les conflits"],
  },
  {
    id: "ecole", label: "Contexte scolaire", domainId: "scolaire", context: "Contexte institutionnel",
    fragilities: ["f-anxiete", "f-concentration", "f-regulation", "f-conflits"],
    description: "Examiner le rythme, les transitions et la clarté des consignes.",
    facts: ["03/10/2026 — Refus de rejoindre l'atelier pendant huit minutes lors d'une transition."], reported: [],
    hypotheses: ["L'annonce préalable de la transition serait-elle aidante ?"],
    unknown: ["L'effet du bruit et de la durée des consignes dans cette situation."],
    resources: ["Supports visuels appréciés", "Équipe éducative disponible"],
    actions: ["Annoncer les changements avec un repère visuel", "Fractionner les consignes"],
    indicators: ["Durée des transitions", "Consignes réalisées sans relance"],
  },
  {
    id: "repos", label: "Sommeil et bien-être", domainId: "sante", context: "Environnement familial",
    fragilities: ["f-anxiete", "f-sommeil", "f-concentration", "f-impulsivite"],
    description: "Explorer le confort et les rythmes avec la famille, sans diagnostic à partir d'une observation isolée.",
    facts: ["15/09/2026 — Bâillements fréquents observés le matin."], reported: [],
    hypotheses: ["La fatigue pourrait-elle influer sur la disponibilité dans certaines activités ?"],
    unknown: ["Durée et qualité du sommeil", "Éventuelles causes médicales"],
    resources: ["Médecin traitant identifié", "Temps calme possible"],
    actions: ["Échanger sur les rythmes sans jugement", "Proposer un temps de repos adapté"],
    indicators: ["Fréquence des signes de fatigue", "Confort rapporté par l'enfant"],
  },
  {
    id: "evenements", label: "Événements de vie", domainId: "environnement", context: "Parcours de vie",
    fragilities: ["f-anxiete", "f-sommeil", "f-regulation"],
    description: "Situer les changements récents dans le parcours, en recueillant seulement les informations nécessaires.",
    facts: ["08/09/2026 — Léo parle de sa nouvelle chambre."],
    reported: ["La famille rapporte un déménagement pendant l'été (exemple fictif)."],
    hypotheses: ["Des repères stables pourraient-ils soutenir l'adaptation à ces changements ?"],
    unknown: ["Le vécu du déménagement par l'enfant."],
    resources: ["Lien régulier école-famille"], actions: ["Accueillir le récit de l'enfant sans questions suggestives", "Maintenir des routines connues"],
    indicators: ["Repères identifiés par l'enfant", "Expression de ses besoins"],
  },
  {
    id: "protection", label: "Ressources protectrices", domainId: "autonomie", context: "Ressources disponibles",
    fragilities: ["f-anxiete", "f-impulsivite", "f-concentration", "f-sommeil", "f-regulation", "f-conflits"],
    description: "Repérer les appuis existants et les moyens choisis par l'enfant pour se sentir soutenu.",
    facts: ["12/09/2026 — Léo accepte de dessiner avec son adulte référent et s'apaise en cinq minutes."], reported: [],
    hypotheses: ["Cet appui pourrait-il être proposé lors d'autres moments difficiles ?"],
    unknown: ["Les appuis que Léo souhaite mobiliser dans d'autres lieux."],
    resources: ["Adulte refuge", "Dessin", "Supports visuels", "Ami privilégié"],
    actions: ["Identifier avec l'enfant ses personnes ressources", "Rendre un espace d'apaisement disponible"],
    indicators: ["Recours spontané à un appui", "Stratégies d'apaisement nommées"],
  },
];

export const factorsFor = (fragilityId: string) => FACTORS.filter((f) => f.fragilities.includes(fragilityId));