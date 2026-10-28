import type { Quest } from "@/data/quests";

export const API = `${import.meta.env.REACT_APP_BACKEND_URL}/api`;

export type Role = "admin" | "direction" | "educator" | "parent" | "internal";
export interface User { user_id: string; email: string; name: string; picture?: string; audience: "pro" | "parent"; auth_enabled?: boolean; role?: Role | null; status?: "pending" | "active" | "revoked"; email_verified?: boolean; created_at?: string }
export interface Avatar { face: number; hair: number; accessory: number; portrait?: string | null }
export type StepStatus = "fait" | "en cours" | "à venir";
export interface Child {
  child_id: string; name: string; age: number; grade: string; notes: string; avatar: Avatar;
  levels: Record<string, number>; initial_levels: Record<string, number>;
  level_history: { domain_id: string; from: number; to: number; date: string }[];
  quest_steps: Record<string, { status: StepStatus; date: string }>; xp: number; created_at: string;
  user_id: string; owner_name?: string; shares?: { email: string; role: "parent" | "pro"; date: string }[]; custom_quests?: (Quest & { custom?: boolean })[]; assigned?: string[]; tree_image?: string | null; access?: "owner" | "assigned" | "shared" | "structure" | "readonly"; avatar_history?: { url: string; date: string; xp: number }[];
}
export interface Observation { obs_id: string; child_id: string; domain_id: string; date: string; fact: string; context: string; author?: string }
export interface AiMessage { role: "user" | "assistant"; text: string; created_at?: string }

const TOKEN_KEY = "enfanceplus.token";
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));
export const authHeaders = (): Record<string, string> => {
  const t = localStorage.getItem(TOKEN_KEY);
  return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: { ...authHeaders(), ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const d = body.detail;
    throw new Error(Array.isArray(d) ? (d.some((x: { loc?: string[] }) => x.loc?.includes("email")) ? "Adresse e-mail invalide" : "Données invalides") : d ?? `Erreur ${res.status}`);
  }
  return res.json();
}

export const send = <T,>(path: string, method: string, body?: unknown) =>
  api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export async function streamAssistant(childId: string, message: string, onDelta: (t: string) => void, save = true) {
  const res = await fetch(`${API}/children/${childId}/assistant`, {
    method: "POST", credentials: "include",
    headers: authHeaders(),
    body: JSON.stringify({ message, save }),
  });
  if (!res.ok || !res.body) throw new Error(`Erreur ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const events = buf.split("\n\n");
    buf = events.pop() ?? "";
    for (const e of events) {
      if (!e.startsWith("data: ")) continue;
      const data = JSON.parse(e.slice(6));
      if (data.error) throw new Error(data.error);
      if (data.delta) onDelta(data.delta);
    }
  }
}
