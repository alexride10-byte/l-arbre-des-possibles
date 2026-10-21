import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Plus, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Portrait } from "@/components/layout/Portrait";
import { ScoreRing } from "@/components/layout/ScoreRing";
import { globalScore } from "@/lib/rpg";
import { DOMAINS } from "@/data/domains";

const ROLE_LABEL: Record<string, string> = { admin: "Administrateur de structure", direction: "Direction", educator: "Éducateur", internal: "Équipe Enfance+" };

export default function ChildrenPage() {
  const { user, profiles, selectChild } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "attention">("all");
  const attention = (c: (typeof profiles)[number]) => DOMAINS.some((d) => (c.levels[d.id] ?? 1) <= 2);
  const list = profiles.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) && (tab === "all" || attention(c)));
  return (
    <div className="page space-y-4" data-testid="children-page">
      <section className="panel flex flex-wrap items-end gap-4 p-6">
        <div className="mr-auto">
          <p className="eyebrow">{ROLE_LABEL[user.role ?? ""] ?? "Compte"}</p>
          <h1 className="font-display text-3xl font-semibold">Bonjour <span className="text-gold">{user.name.split(" ")[0]}</span> !</h1>
          <p className="text-sm text-muted-foreground">Aujourd'hui, {profiles.length} enfant{profiles.length > 1 ? "s" : ""} à suivre.</p>
        </div>
        <div className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un enfant…" className="field h-10 w-60" style={{ paddingLeft: "2.2rem" }} data-testid="children-search" /></div>
        {(user.role === "admin" || user.role === "educator") && <button className="btn-gold-solid" onClick={() => navigate("/profil")} data-testid="children-add-button"><Plus size={15} /> Nouveau dossier</button>}
      </section>
      <div className="seg">
        <button className={`seg-btn ${tab === "all" ? "seg-on" : ""}`} onClick={() => setTab("all")} data-testid="children-tab-all">Mes enfants ({profiles.length})</button>
        <button className={`seg-btn ${tab === "attention" ? "seg-on" : ""}`} onClick={() => setTab("attention")} data-testid="children-tab-attention">Points d'attention ({profiles.filter(attention).length})</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((c) => {
          const s = globalScore(c.levels); const d = s - globalScore(c.initial_levels);
          return (
            <button key={c.child_id} className="child-card group" onClick={() => { selectChild(c.child_id); navigate("/"); }} data-testid={`child-card-${c.child_id}`}>
              <div className="h-40 overflow-hidden"><Portrait avatar={c.avatar} alt={c.name} className="transition-transform duration-700 group-hover:scale-105" /></div>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-display text-lg font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.age} ans · {c.grade || "—"}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs">
                    {attention(c) && <AlertCircle size={12} className="text-rose-300" />}
                    <span className={d >= 0 ? "text-emerald-300" : "text-rose-300"}>{d >= 0 ? "+" : ""}{d} pts</span>
                    <span className="text-muted-foreground">depuis l'ouverture</span>
                  </p>
                </div>
                <ScoreRing value={s} size={58} />
                <ChevronRight size={18} className="text-muted-foreground" />
              </div>
            </button>
          );
        })}
        {list.length === 0 && <p className="text-sm text-muted-foreground" data-testid="children-empty">Aucun dossier attribué.</p>}
      </div>
    </div>
  );
}
