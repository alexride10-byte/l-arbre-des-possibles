import { useState } from "react";
import { Cloud, HardDrive } from "lucide-react";
import { listLocalModels, setAiConfig, useAiConfig } from "@/lib/localAi";

export function AiSettings() {
  const cfg = useAiConfig();
  const [status, setStatus] = useState("");
  const test = async () => {
    setStatus("Test en cours…");
    try {
      const models = await listLocalModels(cfg);
      setStatus(models.length ? `Connecté · modèles : ${models.slice(0, 4).join(", ")}` : "Connecté, mais aucun modèle installé (ollama pull llama3.1)");
    } catch {
      setStatus("Injoignable. Lancez Ollama avec OLLAMA_ORIGINS=\"*\" ollama serve");
    }
  };
  return (
    <div className="space-y-2" data-testid="ai-settings">
      <p className="eyebrow pt-2">Assistant IA</p>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setAiConfig({ ...cfg, provider: "cloud" })} className={`chip flex items-center justify-center gap-1.5 ${cfg.provider === "cloud" ? "chip-active" : ""}`} data-testid="ai-provider-cloud"><Cloud size={13} /> Cloud</button>
        <button onClick={() => setAiConfig({ ...cfg, provider: "local" })} className={`chip flex items-center justify-center gap-1.5 ${cfg.provider === "local" ? "chip-active" : ""}`} data-testid="ai-provider-local"><HardDrive size={13} /> Locale</button>
      </div>
      {cfg.provider === "local" ? (
        <div className="space-y-2">
          <input className="field" value={cfg.url} onChange={(e) => setAiConfig({ ...cfg, url: e.target.value })} placeholder="http://localhost:11434" aria-label="Adresse Ollama" data-testid="ai-local-url" />
          <input className="field" value={cfg.model} onChange={(e) => setAiConfig({ ...cfg, model: e.target.value })} placeholder="llama3.1" aria-label="Modèle" data-testid="ai-local-model" />
          <button className="btn-outline w-full" onClick={test} data-testid="ai-local-test">Tester la connexion</button>
          {status && <p className="text-[11px] text-muted-foreground" data-testid="ai-local-status">{status}</p>}
          <p className="text-[11px] text-muted-foreground">Ollama tourne sur votre ordinateur : les échanges avec l'IA ne quittent pas votre machine et l'historique reste dans ce navigateur.</p>
        </div>
      ) : <p className="text-[11px] text-muted-foreground">Claude (cloud). Les échanges sont envoyés au serveur Enfance+ puis au fournisseur d'IA.</p>}
    </div>
  );
}
