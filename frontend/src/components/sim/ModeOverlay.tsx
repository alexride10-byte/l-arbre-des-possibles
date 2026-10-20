import { X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { HORIZONS, SCENARIOS } from "@/lib/rpg";

export function ModeOverlay() {
  const { mode, setMode, scenario, setScenario, horizon, setHorizon } = useApp();
  return (
    <div className="popover absolute bottom-3 right-3 z-20 w-72 space-y-3 p-4" data-testid="mode-overlay">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{mode === "simulation" ? "Simulation future" : "Comparaison"}</p>
        <button className="icon-btn h-7 w-7" onClick={() => setMode("actuelle")} aria-label="Fermer" data-testid="mode-overlay-close"><X size={14} /></button>
      </div>
      {mode === "simulation" ? (
        <>
          <div className="grid grid-cols-2 gap-1.5">
            {SCENARIOS.map((s) => (
              <button key={s.id} onClick={() => setScenario(s.id)} className={`chip text-left ${scenario === s.id ? "chip-active" : ""}`} data-testid={`overlay-scenario-${s.id}`}>
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</button>
            ))}
          </div>
          <label className="block text-xs text-muted-foreground">Horizon : <b className="text-foreground">{HORIZONS[horizon]?.label}</b>
            <input type="range" min={0} max={HORIZONS.length - 1} value={horizon} onChange={(e) => setHorizon(Number(e.target.value))} className="mt-2 w-full accent-blue-500" data-testid="horizon-slider" />
          </label>
          <p className="text-[11px] text-muted-foreground">Les niveaux affichés sur l'arbre sont projetés. Projection illustrative, jamais une prédiction.</p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Chaque domaine affiche <b className="text-foreground">niveau initial → niveau actuel</b>, depuis la création du profil.</p>
      )}
    </div>
  );
}
