import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { send, type Child } from "@/lib/api";
import { generateQuestLocal, useAiConfig } from "@/lib/localAi";
import { DOMAINS } from "@/data/domains";

export function GenerateQuest({ domainId, compact = false }: { domainId?: string; compact?: boolean }) {
  const { child, user, observations, saveChild } = useApp();
  const cfg = useAiConfig();
  const [open, setOpen] = useState(!compact);
  const [domain, setDomain] = useState(domainId ?? "emotionnel");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  if (!child) return null;

  const run = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg("");
    try {
      const base = `/children/${child.child_id}/quests`;
      const updated = cfg.provider === "local"
        ? await send<Child>(base, "POST", await generateQuestLocal(cfg, user, child, observations, domain, goal))
        : await send<Child>(`${base}/generate`, "POST", { domain_id: domain, goal });
      saveChild(updated);
      setGoal(""); setMsg(`Quête « ${updated.custom_quests?.at(-1)?.title} » ajoutée au parcours.`);
    } catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  };

  if (!open) return <button className="btn-ai w-full justify-center" onClick={() => setOpen(true)} data-testid="generate-quest-open"><Wand2 size={15} /> Créer une quête avec l'IA</button>;
  return (
    <form onSubmit={run} className="panel space-y-3 p-4" data-testid="generate-quest-form">
      <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={15} className="text-gold" /> Nouvelle quête générée par l'IA {cfg.provider === "local" && <span className="pill-muted">locale</span>}</p>
      <div className={compact ? "space-y-2" : "grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto]"}>
        {!domainId && (
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className="field" aria-label="Domaine" data-testid="generate-quest-domain">
            {DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
        <input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={`Objectif (facultatif) : ex. « mieux gérer la frustration »`} className="field" data-testid="generate-quest-goal" />
        <button type="submit" disabled={busy} className="btn-primary" data-testid="generate-quest-submit">{busy ? "Création…" : "Générer"}</button>
      </div>
      {msg && <p className="text-xs text-muted-foreground" data-testid="generate-quest-message">{msg}</p>}
    </form>
  );
}
