import type { Observation, ObservationRepository } from "./services";

// Stockage navigateur uniquement (localStorage). Aucune requête réseau.
// Non chiffré : adapté à des données fictives, pas encore à des données sensibles.
const KEY = "enfanceplus.observations.v1";

function readAll(): Observation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Observation[];
  } catch {
    return [];
  }
}

function writeAll(list: Observation[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export const localObservationRepository: ObservationRepository = {
  async list(domainId) {
    const all = readAll();
    return (domainId ? all.filter((o) => o.domainId === domainId) : all).sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  },
  async save(o) {
    const all = readAll();
    const i = all.findIndex((x) => x.id === o.id);
    if (i >= 0) all[i] = o;
    else all.push(o);
    writeAll(all);
  },
  async remove(id) {
    writeAll(readAll().filter((o) => o.id !== id));
  },
};
