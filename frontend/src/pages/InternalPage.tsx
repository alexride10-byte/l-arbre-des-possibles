import { useEffect, useState } from "react";
import { Building2, Lock } from "lucide-react";
import { api } from "@/lib/api";

interface Stats { children: number; observations: number; ai_messages: number; custom_quests: number; users_by_role: Record<string, number>; users_by_status: Record<string, number> }

export default function InternalPage() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { api<Stats>("/internal/stats").then(setS); }, []);
  const cards = s ? [["Dossiers", s.children], ["Observations", s.observations], ["Échanges IA", s.ai_messages], ["Quêtes IA", s.custom_quests]] : [];
  return (
    <div className="page space-y-4" data-testid="internal-page">
      <section className="panel flex items-center gap-4 p-6">
        <span className="medal-lg" style={{ ["--c" as string]: "#38bdf8" }}><Building2 size={24} /></span>
        <div><p className="eyebrow">Espace interne</p><h1 className="font-display text-3xl font-semibold">Équipe Enfance+</h1>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock size={12} /> Indicateurs agrégés uniquement : aucun accès aux dossiers nominatifs des enfants.</p></div>
      </section>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([l, v]) => <div key={l} className="panel p-5" data-testid={`internal-stat-${l}`}><p className="text-xs text-muted-foreground">{l}</p><p className="font-display text-4xl font-bold text-gold">{v}</p></div>)}
      </div>
      {s && <section className="panel grid gap-4 p-5 md:grid-cols-2">
        <div><p className="mb-2 text-sm font-semibold">Comptes par rôle</p>{Object.entries(s.users_by_role).map(([k, v]) => <p key={k} className="text-sm text-muted-foreground">{k === "None" ? "sans rôle" : k} : <b className="text-foreground">{v}</b></p>)}</div>
        <div><p className="mb-2 text-sm font-semibold">Comptes par statut</p>{Object.entries(s.users_by_status).map(([k, v]) => <p key={k} className="text-sm text-muted-foreground">{k} : <b className="text-foreground">{v}</b></p>)}</div>
      </section>}
    </div>
  );
}
