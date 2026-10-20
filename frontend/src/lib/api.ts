export const API = `${import.meta.env.REACT_APP_BACKEND_URL}/api`;

export interface User { user_id: string; email: string; name: string; picture?: string; audience: "pro" | "parent"; auth_enabled?: boolean }
export interface Avatar { face: number; hair: number; accessory: number }
export type StepStatus = "fait" | "en cours" | "à venir";
export interface Child {
  child_id: string; name: string; age: number; grade: string; notes: string; avatar: Avatar;
  levels: Record<string, number>; initial_levels: Record<string, number>;
  level_history: { domain_id: string; from: number; to: number; date: string }[];
  quest_steps: Record<string, { status: StepStatus; date: string }>; xp: number; created_at: string;
}
export interface Observation { obs_id: string; child_id: string; domain_id: string; date: string; fact: string; context: string }
export interface AiMessage { role: "user" | "assistant"; text: string; created_at?: string }

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail ?? `Erreur ${res.status}`);
  }
  return res.json();
}

export const send = <T,>(path: string, method: string, body?: unknown) =>
  api<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });

export async function streamAssistant(childId: string, message: string, onDelta: (t: string) => void, save = true) {
  const res = await fetch(`${API}/children/${childId}/assistant`, {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
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
