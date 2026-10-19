// Interfaces prévues pour les évolutions futures (non implémentées en V1).
// Aucune donnée n'est enregistrée : la conservation locale n'est PAS encore assurée.

export interface Observation {
  id: string;
  domainId: string;
  date: string;
  fact: string;
  context?: string;
}

/** Stockage interchangeable (ex. futur stockage local chiffré, appli bureau). */
export interface ObservationRepository {
  list(domainId?: string): Promise<Observation[]>;
  save(o: Observation): Promise<void>;
}

/** Assistant IA interchangeable (ex. futur modèle local). */
export interface AssistantProvider {
  name: string;
  summarize(observations: Observation[]): Promise<string>;
}

export const noopAssistant: AssistantProvider = {
  name: "Aucun (désactivé)",
  summarize: async () => "Assistant non configuré dans cette version.",
};
