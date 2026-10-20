import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, send, type Child, type Observation, type StepStatus, type User } from "@/lib/api";
import type { ScenarioId } from "@/lib/rpg";

export type Mode = "actuelle" | "simulation" | "comparaison";

interface AppCtx {
  user: User; setUser: (u: User) => void; logout: () => Promise<void>;
  profiles: Child[]; child: Child | null; selectChild: (id: string) => void; reloadProfiles: () => Promise<void>; saveChild: (c: Child) => void;
  observations: Observation[]; reloadObs: () => Promise<void>;
  setLevel: (domainId: string, level: number) => Promise<void>;
  setStep: (questId: string, idx: number, status: StepStatus) => Promise<void>;
  hidden: string[]; toggleDomain: (id: string) => void; resetView: () => void;
  mode: Mode; setMode: (m: Mode) => void; scenario: ScenarioId; setScenario: (s: ScenarioId) => void; horizon: number; setHorizon: (h: number) => void;
  focus: string | null; node: string | null; frag: string | null; factorId: string | null;
  openDomain: (id: string) => void; openNode: (domainId: string, nodeId: string) => void; openFrag: (id: string) => void; setFactorId: (id: string | null) => void; back: () => void;
  assistant: { open: boolean; prompt?: string; nonce: number }; openAssistant: (prompt?: string) => void; closeAssistant: () => void;
}

const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => useContext(Ctx)!;
const KEY = "enfanceplus.child";

export function AppProvider({ initialUser, children }: { initialUser: User; children: ReactNode }) {
  const [user, setUser] = useState(initialUser);
  const [profiles, setProfiles] = useState<Child[]>([]);
  const [childId, setChildId] = useState<string | null>(() => localStorage.getItem(KEY));
  const [observations, setObs] = useState<Observation[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("actuelle");
  const [scenario, setScenario] = useState<ScenarioId>("actuel");
  const [horizon, setHorizon] = useState(6);
  const [focus, setFocus] = useState<string | null>(null);
  const [node, setNode] = useState<string | null>(null);
  const [frag, setFrag] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [assistant, setAssistant] = useState<{ open: boolean; prompt?: string; nonce: number }>({ open: false, nonce: 0 });

  const child = profiles.find((p) => p.child_id === childId) ?? profiles[0] ?? null;

  const reloadProfiles = useCallback(async () => setProfiles(await api<Child[]>("/children")), []);
  const reloadObs = useCallback(async () => {
    if (child) setObs(await api<Observation[]>(`/children/${child.child_id}/observations`));
  }, [child?.child_id]);
  useEffect(() => { reloadProfiles(); }, [reloadProfiles]);
  useEffect(() => { reloadObs(); }, [reloadObs]);

  const saveChild = (c: Child) => setProfiles((ps) => ps.map((p) => (p.child_id === c.child_id ? c : p)));
  const back = () => { setFocus(null); setNode(null); setFrag(null); setFactorId(null); };

  const value: AppCtx = {
    user, setUser,
    logout: async () => { await send("/auth/logout", "POST"); window.location.href = "/"; },
    profiles, child, reloadProfiles, saveChild,
    selectChild: (id) => { localStorage.setItem(KEY, id); setChildId(id); back(); },
    observations, reloadObs,
    setLevel: async (domainId, level) => { if (child) saveChild(await send<Child>(`/children/${child.child_id}/levels`, "PUT", { domain_id: domainId, level })); },
    setStep: async (q, i, status) => { if (child) saveChild(await send<Child>(`/children/${child.child_id}/quests/${q}/steps/${i}`, "PUT", { status })); },
    hidden, toggleDomain: (id) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id])),
    resetView: () => { setHidden([]); setMode("actuelle"); setScenario("actuel"); back(); },
    mode, setMode, scenario, setScenario, horizon, setHorizon,
    focus, node, frag, factorId, setFactorId, back,
    openDomain: (id) => { setFactorId(null); setFrag(null); setFocus(id); setNode(null); setHidden((h) => h.filter((x) => x !== id)); },
    openNode: (d, n) => { setFactorId(null); setFrag(null); setFocus(d); setNode(n); },
    openFrag: (id) => { setFocus(null); setNode(null); setFactorId(null); setFrag(id); },
    assistant,
    openAssistant: (prompt) => setAssistant({ open: true, prompt, nonce: Date.now() }),
    closeAssistant: () => setAssistant((a) => ({ ...a, open: false, prompt: undefined })),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
