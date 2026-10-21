import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type PromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function InstallButton() {
  const [evt, setEvt] = useState<PromptEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as PromptEvent); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!evt) return setHelp(true);
    await evt.prompt();
    if ((await evt.userChoice).outcome === "accepted") setInstalled(true);
    setEvt(null);
  };

  return (
    <div className="relative">
      <button className="icon-btn" onClick={install} aria-label="Installer l'application" title="Installer l'application" data-testid="install-app-button"><Download size={19} /></button>
      {help && (
        <div className="popover absolute right-0 top-12 z-50 w-72 space-y-2 p-4" data-testid="install-help-popover">
          <div className="flex items-center justify-between"><p className="eyebrow">Installer Enfance+</p>
            <button onClick={() => setHelp(false)} aria-label="Fermer" data-testid="install-help-close"><X size={14} /></button></div>
          {isIOS()
            ? <p className="text-xs text-muted-foreground">Sur iPhone / iPad : ouvrez le site dans <span className="text-gold">Safari</span>, touchez <span className="text-gold">Partager</span> puis <span className="text-gold">« Sur l'écran d'accueil »</span>.</p>
            : <p className="text-xs text-muted-foreground">Sur ordinateur (Chrome, Edge) : cliquez sur l'icône <span className="text-gold">Installer</span> à droite de la barre d'adresse. Sur Android : menu <span className="text-gold">⋮</span> puis <span className="text-gold">« Installer l'application »</span>.</p>}
        </div>
      )}
    </div>
  );
}
