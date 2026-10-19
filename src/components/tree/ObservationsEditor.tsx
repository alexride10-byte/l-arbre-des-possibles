import { useCallback, useEffect, useState } from "react";
import type { Observation } from "@/lib/services";
import { localObservationRepository as repo } from "@/lib/local-observations";

const today = () => new Date().toISOString().slice(0, 10);
const empty = { id: "", date: "", fact: "", context: "" };

export function ObservationsEditor({ domainId }: { domainId: string }) {
  const [items, setItems] = useState<Observation[]>([]);
  const [draft, setDraft] = useState<typeof empty | null>(null);
  const [query, setQuery] = useState("");

  const refresh = useCallback(() => repo.list(domainId).then(setItems), [domainId]);
  useEffect(() => { refresh(); }, [refresh]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.fact.trim()) return;
    await repo.save({
      id: draft.id || crypto.randomUUID(),
      domainId,
      date: draft.date || today(),
      fact: draft.fact.trim(),
      context: draft.context.trim() || undefined,
    });
    setDraft(null);
    refresh();
  };

  const q = query.toLowerCase();
  const shown = items.filter((o) => !q || o.fact.toLowerCase().includes(q) || (o.context ?? "").toLowerCase().includes(q) || o.date.includes(q));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="eyebrow">Mes observations (locales)</h3>
        {!draft && (
          <button className="btn-ghost" onClick={() => setDraft({ ...empty, date: today() })}>+ Ajouter</button>
        )}
      </div>

      {draft && (
        <form onSubmit={submit} className="space-y-2 rounded-lg border border-border/60 bg-muted/40 p-3">
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="field" aria-label="Date" />
          <textarea required rows={3} placeholder="Fait observé (sans interprétation)" value={draft.fact}
            onChange={(e) => setDraft({ ...draft, fact: e.target.value })} className="field" aria-label="Fait observé" />
          <input placeholder="Contexte (facultatif)" value={draft.context}
            onChange={(e) => setDraft({ ...draft, context: e.target.value })} className="field" aria-label="Contexte" />
          <div className="flex gap-2">
            <button type="submit" className="btn-gold flex-1">{draft.id ? "Enregistrer" : "Ajouter"}</button>
            <button type="button" className="btn-ghost" onClick={() => setDraft(null)}>Annuler</button>
          </div>
        </form>
      )}

      {items.length > 0 && (
        <input placeholder="Rechercher…" value={query} onChange={(e) => setQuery(e.target.value)} className="field" aria-label="Rechercher une observation" />
      )}

      {shown.length === 0 && !draft && (
        <p className="text-xs text-muted-foreground">{items.length ? "Aucun résultat." : "Aucune observation enregistrée sur cet appareil."}</p>
      )}

      <ul className="space-y-2">
        {shown.map((o) => (
          <li key={o.id} className="group border-l border-gold/50 pl-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{o.date}</span>
              <span className="flex gap-3 text-xs text-muted-foreground">
                <button className="hover:text-foreground" onClick={() => setDraft({ id: o.id, date: o.date, fact: o.fact, context: o.context ?? "" })}>Modifier</button>
                <button className="hover:text-destructive" onClick={async () => { await repo.remove(o.id); refresh(); }}>Supprimer</button>
              </span>
            </div>
            {o.fact}
            {o.context && <p className="text-xs text-muted-foreground">Contexte : {o.context}</p>}
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-muted-foreground/70">Conservé uniquement dans ce navigateur, non chiffré, aucun envoi distant. Réservé aux données fictives.</p>
    </section>
  );
}
