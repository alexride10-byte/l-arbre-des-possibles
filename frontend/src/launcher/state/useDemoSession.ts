import { useCallback, useEffect, useState } from "react";

const KEY = "enfance-launcher-session";

export interface LauncherSettings { motion: boolean; particles: boolean; labels: boolean }
export interface DemoSession { started: boolean; avatar: string; domain: string | null; settings: LauncherSettings }

const fresh = (): DemoSession => ({
  started: false, avatar: "lina", domain: null,
  settings: { motion: !window.matchMedia("(prefers-reduced-motion: reduce)").matches, particles: true, labels: true },
});

function load(): DemoSession {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return fresh(); }
}

export function useDemoSession() {
  const [session, setSession] = useState<DemoSession>(load);
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(session)), [session]);
  const update = useCallback((p: Partial<DemoSession>) => setSession((s) => ({ ...s, ...p })), []);
  const reset = useCallback(() => setSession(fresh()), []);
  return { session, update, reset };
}
