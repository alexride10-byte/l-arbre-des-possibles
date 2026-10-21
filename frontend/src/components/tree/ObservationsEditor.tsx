import { useState } from "react";
import { send, type Observation } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { frDate } from "@/lib/icons";

const today = () => new Date().toISOString().slice(0, 10);
const empty = { obs_id: "", date: "", fact: "", context: "" };

export function ObservationsEditor({ domainId }: { domainId: string }) {
  const { child, observations, reloadObs, reloadProfiles, canWrite } = useApp();
  const [draft, setDraft] = useState<typeof empty | null>(null);
  const [query, setQuery] = useState("");
  if (!child) return null;
  const base = `/children/${child.child_id}/observations`;
  const items = observations.filter((o) => o.domain_id === domainId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft?.fact.trim()) return;
    const body = { domain_id: domainId, date: draft.date || today(), fact: draft.fact.trim(), context: draft.context.trim() };
    if (draft.obs_id) await send<Observation>(`${base}/${draft.obs_id}`, "PUT", body);
    else await send<Observation>(base, "POST", body);
    setDraft(null);
    await Promise.all([reloadObs(), reloadProfiles()]);
  };

  const q = query.toLowerCase();
  const shown = items.filter((o) => !q || o.fact.toLowerCase().includes(q) || o.context.toLowerCase().includes(q) || o.date.includes(q));
  return (
    <section className="space-y-3" data-testid="observations-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Mes observations <span className="text-[11px] font-normal text-gold">+10 XP</span></h3>
        {!draft && canWrite && <button className="btn-ghost" onClick={() => setDraft({ ...empty, date: today() })} data-testid="observation-add-button">+ Ajouter</button>}
      </div>
      {draft && (
        <form onSubmit={submit} className="space-y-2 rounded-lg border border-border bg-muted/40 p-3" data-testid="observation-form">
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="field" aria-label="Date" data-testid="observation-date-input" />
          <textarea required rows={3} placeholder="Fait observé (sans interprétation)" value={draft.fact} onChange={(e) => setDraft({ ...draft, fact: e.target.value })} className="field" data-testid="observation-fact-input" />
          <input placeholder="Contexte (facultatif)" value={draft.context} onChange={(e) => setDraft({ ...draft, context: e.target.value })} className="field" data-testid="observation-context-input" />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" data-testid="observation-submit-button">{draft.obs_id ? "Enregistrer" : "Ajouter"}</button>
            <button type="button" className="btn-ghost" onClick={() => setDraft(null)} data-testid="observation-cancel-button">Annuler</button>
          </div>
        </form>
      )}
      {items.length > 0 && <input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="field" data-testid="observation-search-input" />}
      {shown.length === 0 && !draft && <p className="text-xs text-muted-foreground">{items.length ? "Aucun résultat." : "Aucune observation enregistrée."}</p>}
      <ul className="space-y-2">
        {shown.map((o) => (
          <li key={o.obs_id} className="border-l border-gold/50 pl-3 text-sm" data-testid={`observation-item-${o.obs_id}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{frDate(o.date)}{o.author && ` · ${o.author}`}</span>
              <span className="flex gap-3 text-xs text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => setDraft({ obs_id: o.obs_id, date: o.date, fact: o.fact, context: o.context })} data-testid={`observation-edit-${o.obs_id}`}>Modifier</button>
                <button className="hover:text-red-300" onClick={async () => { await send(`${base}/${o.obs_id}`, "DELETE"); reloadObs(); }} data-testid={`observation-delete-${o.obs_id}`}>Supprimer</button>
              </span>
            </div>
            {o.fact}
            {o.context && <p className="text-xs text-muted-foreground">Contexte : {o.context}</p>}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/70">Enregistré sur le serveur sécurisé, lié à votre compte.</p>
    </section>
  );
}
