import { useEffect, useState } from "react";
import { streamAssistant, type AiMessage, type Child, type Observation, type User } from "./api";
import { DOMAINS } from "@/data/domains";

export interface AiConfig { provider: "cloud" | "local"; url: string; model: string }
const KEY = "enfanceplus.ai";
const DEFAULT: AiConfig = { provider: "cloud", url: "http://localhost:11434", model: "llama3.1" };

export const getAiConfig = (): AiConfig => ({ ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") });
export const setAiConfig = (c: AiConfig) => { localStorage.setItem(KEY, JSON.stringify(c)); window.dispatchEvent(new Event("ai-config")); };

export function useAiConfig() {
  const [cfg, setCfg] = useState(getAiConfig);
  useEffect(() => {
    const f = () => setCfg(getAiConfig());
    window.addEventListener("ai-config", f);
    return () => window.removeEventListener("ai-config", f);
  }, []);
  return cfg;
}

export function buildSystemPrompt(user: User, child: Child, obs: Observation[]) {
  const audience = user.audience === "parent" ? "un parent" : "un professionnel de l'enfance (éducateur, psychologue, enseignant)";
  const levels = DOMAINS.map((d) => `${d.name}: ${child.levels[d.id]}/5`).join(", ");
  const list = obs.slice(0, 30).map((o) => `- ${o.date} [${o.domain_id}] ${o.fact}${o.context ? ` (contexte : ${o.context})` : ""}`).join("\n") || "- Aucune observation enregistrée.";
  return `Tu es l'assistant d'Enfance+, outil d'accompagnement du développement de l'enfant. Tu t'adresses à ${audience}. Réponds toujours en français, de façon chaleureuse, claire et concise (markdown léger).
Enfant suivi : ${child.name}, ${child.age} ans, ${child.grade || "niveau non précisé"}. Notes : ${child.notes || "—"}.
Niveaux d'épanouissement estimés (1 à 5) : ${levels}.
Observations :
${list}
Règles : jamais de diagnostic ; distingue faits observés, hypothèses et pistes ; aucune causalité affirmée ; projections illustratives seulement ; oriente vers les professionnels adaptés ; en cas de danger, 119 ou 15/17.`;
}

export const questPrompt = (domainId: string, goal: string) =>
  `Crée une quête d'accompagnement pour le domaine « ${domainId} »${goal ? ` avec cet objectif : ${goal}` : ""}. Réponds UNIQUEMENT avec un JSON valide, sans texte autour : {"title": "...", "term": "Court terme (2–4 semaines)" | "Moyen terme (1–3 mois)" | "Long terme (3–6 mois)", "steps": [{"title": "1 à 3 mots", "objective": "...", "action": "...", "resource": "...", "indicator": "..."}]} avec 3 ou 4 étapes concrètes et bienveillantes.`;

type Msg = { role: "system" | "user" | "assistant"; content: string };

export async function listLocalModels(cfg: AiConfig): Promise<string[]> {
  const res = await fetch(`${cfg.url}/api/tags`);
  if (!res.ok) throw new Error(`Ollama a répondu ${res.status}`);
  return ((await res.json()).models ?? []).map((m: { name: string }) => m.name);
}

async function streamLocal(cfg: AiConfig, messages: Msg[], onDelta: (t: string) => void) {
  const res = await fetch(`${cfg.url}/api/chat`, { method: "POST", body: JSON.stringify({ model: cfg.model, messages, stream: true }) })
    .catch(() => { throw new Error(`IA locale injoignable à ${cfg.url}. Lancez Ollama avec OLLAMA_ORIGINS="*" ollama serve, puis vérifiez le modèle « ${cfg.model} ».`); });
  if (!res.ok || !res.body) throw new Error(`IA locale injoignable (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const l of lines) if (l.trim()) { const d = JSON.parse(l); if (d.error) throw new Error(d.error); if (d.message?.content) onDelta(d.message.content); }
  }
}

const historyKey = (id: string) => `enfanceplus.local-chat.${id}`;
export const localHistory = {
  get: (id: string): AiMessage[] => JSON.parse(localStorage.getItem(historyKey(id)) ?? "[]"),
  set: (id: string, msgs: AiMessage[]) => localStorage.setItem(historyKey(id), JSON.stringify(msgs.slice(-60))),
};

interface AskArgs { cfg: AiConfig; user: User; child: Child; obs: Observation[]; history: AiMessage[]; message: string; onDelta: (t: string) => void; save?: boolean }

export async function askAI({ cfg, user, child, obs, history, message, onDelta, save = true }: AskArgs) {
  if (cfg.provider === "cloud") return streamAssistant(child.child_id, message, onDelta, save);
  const msgs: Msg[] = [{ role: "system", content: buildSystemPrompt(user, child, obs) },
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.text })), { role: "user", content: message }];
  return streamLocal(cfg, msgs, onDelta);
}

export async function generateQuestLocal(cfg: AiConfig, user: User, child: Child, obs: Observation[], domainId: string, goal: string) {
  let raw = "";
  await streamLocal(cfg, [{ role: "system", content: buildSystemPrompt(user, child, obs) }, { role: "user", content: questPrompt(domainId, goal) }], (d) => { raw += d; });
  try { return { ...JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)), domainId }; }
  catch { throw new Error("L'IA locale n'a pas renvoyé une quête exploitable, réessayez."); }
}
