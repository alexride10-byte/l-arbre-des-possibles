import { useCallback, useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { PORTRAITS } from "@/lib/assets";
import { DOMAINS_L } from "./data/launcher";
import { useDemoSession } from "./state/useDemoSession";
import { Atmosphere } from "./scene/Atmosphere";
import { TreeScene } from "./scene/TreeScene";
import { HomeOverlay } from "./ui/HomeOverlay";
import { ExploreBar, ExploreHint } from "./ui/ExploreBar";
import { DomainSheet } from "./ui/DomainSheet";
import { NodeSheet } from "./ui/NodeSheet";
import { ProfilePanel } from "./ui/ProfilePanel";
import { SettingsPanel } from "./ui/SettingsPanel";
import "./launcher.css";

type Panel = "profile" | "settings" | null;

export default function LauncherPage() {
  const { session, update, reset } = useDemoSession();
  const [mode, setMode] = useState<"home" | "explore">("home");
  const [domainId, setDomainId] = useState<string | null>(null);
  const [subId, setSubId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);

  const openDomain = useCallback((id: string) => {
    setMode("explore"); setFocusId(null); setSubId(null); setDomainId(id); update({ started: true, domain: id });
  }, [update]);
  const openNode = useCallback((id: string) => { setMode("explore"); setDomainId(null); setSubId(null); setFocusId(id); update({ started: true }); }, [update]);
  const back = useCallback(() => { setDomainId(null); setSubId(null); setFocusId(null); }, []);
  const explore = () => { setMode("explore"); update({ started: true }); };
  const home = () => { back(); setPanel(null); setMode("home"); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panel) setPanel(null); else if (domainId || focusId) back(); else setMode("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, domainId, focusId, back]);

  const domain = DOMAINS_L.find((d) => d.id === domainId);
  const avatar = PORTRAITS.find((p) => p.id === session.avatar)?.url;
  const view = mode === "home" ? "home" : domainId ? "domain" : focusId || panel ? "panel" : "overview";
  const { settings } = session;

  return (
    <main className={`launcher ${settings.motion ? "" : "motion-off"}`} data-testid="launcher-page">
      <Atmosphere particles={settings.particles && settings.motion} />
      <TreeScene view={view} domainId={domainId} focusId={focusId} subId={subId} avatar={avatar} labels={settings.labels}
        onDomain={openDomain} onNode={openNode} onSub={setSubId} onAvatar={() => setPanel("profile")} />
      {mode === "home"
        ? <HomeOverlay canResume={session.started} onExplore={explore} onResume={() => (session.domain ? openDomain(session.domain) : explore())} onProfile={() => setPanel("profile")} />
        : <ExploreBar domainName={domain?.name} avatar={avatar} onHome={home} onBack={domainId || focusId ? back : undefined} onProfile={() => setPanel("profile")} />}
      <button className="lx-gear" onClick={() => setPanel(panel === "settings" ? null : "settings")} aria-label="Paramètres" data-testid="launcher-settings-button"><Settings size={18} /></button>
      {mode === "explore" && !domainId && !focusId && !panel && <ExploreHint />}
      {domain && <DomainSheet domain={domain} subId={subId} onSub={setSubId} onBack={back} />}
      {focusId && <NodeSheet id={focusId} onClose={back} onDomain={openDomain} onNode={openNode} />}
      {panel === "profile" && <ProfilePanel avatar={session.avatar} onAvatar={(a) => update({ avatar: a })} onClose={() => setPanel(null)} />}
      {panel === "settings" && <SettingsPanel settings={settings} onChange={(s) => update({ settings: s })} onReset={() => { reset(); home(); }} onClose={() => setPanel(null)} />}
    </main>
  );
}
