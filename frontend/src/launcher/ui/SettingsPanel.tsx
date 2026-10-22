import { LogIn, RotateCcw } from "lucide-react";
import type { LauncherSettings } from "../state/useDemoSession";
import { Section, Sheet } from "./Sheet";

interface Props { settings: LauncherSettings; onChange: (s: LauncherSettings) => void; onReset: () => void; onClose: () => void }

const ROWS: [keyof LauncherSettings, string, string][] = [
  ["motion", "Animations", "Croissance de l'arbre, zoom et lumières animées"],
  ["particles", "Particules lumineuses", "Lucioles flottant autour de l'arbre"],
  ["labels", "Noms sur l'arbre", "Afficher les noms des domaines et des nœuds"],
];

export function SettingsPanel({ settings, onChange, onReset, onClose }: Props) {
  return (
    <Sheet eyebrow="Réglages" title="Paramètres" onClose={onClose} testid="settings-panel">
      <Section title="Affichage">
        {ROWS.map(([k, label, hint]) => (
          <label key={k} className="lx-toggle-row">
            <span><b>{label}</b><small>{hint}</small></span>
            <input type="checkbox" className="lx-toggle" checked={settings[k]} onChange={(e) => onChange({ ...settings, [k]: e.target.checked })} data-testid={`setting-${k}`} />
          </label>
        ))}
      </Section>
      <Section title="Démonstration">
        <button className="lx-btn lx-btn-ghost w-full" onClick={onReset} data-testid="reset-demo-button"><RotateCcw size={16} /> Réinitialiser la démonstration</button>
      </Section>
      <Section title="Espace professionnel">
        <a href="/connexion" className="lx-btn lx-btn-ghost w-full" data-testid="settings-login-link"><LogIn size={16} /> Se connecter</a>
      </Section>
    </Sheet>
  );
}
