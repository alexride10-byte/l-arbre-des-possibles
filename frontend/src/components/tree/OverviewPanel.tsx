import { Award, Lock, Sparkles, IdCard, Play, ChevronRight, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { badges, domainRanking, globalScore, nextSuggestions, scoreLabel, xpLevel } from "@/lib/rpg";
import { ScoreRing } from "@/components/layout/ScoreRing";

export function OverviewPanel() {
  const { child, observations, openAssistant } = useApp();
  const navigate = useNavigate();
  if (!child) return null;
  const score = globalScore(child.levels);
  const rank = domainRanking(child);
  const lvl = xpLevel(child.xp);
  const list = badges(child, observations);
  const Row = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const Icon = DOMAIN_ICON[id] ?? Sprout;
    return (
      <button onClick={() => navigate(`/domaine/${id}`)} className="overview-row" data-testid={`overview-domain-${id}`}>
        <span className="medal-xs" style={{ ["--c" as string]: domainColor(id) }}><Icon size={12} /></span>{children}<ChevronRight size={14} className="text-muted-foreground" />
      </button>
    );
  };
  return (
    <aside className="panel panel-enter flex h-full flex-col gap-4 overflow-y-auto p-5" data-testid="overview-panel">
      <div className="flex items-center gap-4">
        <ScoreRing value={score} size={96} />
        <div className="min-w-0">
          <p className="eyebrow">Indicateur global</p>
          <p className="font-display text-3xl font-bold" data-testid="global-score">{score}<span className="text-base text-muted-foreground"> / 100</span></p>
          <p className="text-sm text-emerald-300">{scoreLabel(score)}</p>
          <p className="text-[11px] text-muted-foreground" data-testid="xp-total">Niveau {lvl.level} · {child.xp} XP</p>
        </div>
      </div>
      <section className="space-y-1">
        <h3 className="text-sm font-semibold">Points forts</h3>
        {rank.slice(0, 3).map(({ d, level, delta }) => (
          <Row key={d.id} id={d.id}><span className="flex-1 truncate text-left text-xs">{d.name}</span><span className="text-xs text-emerald-300">{delta > 0 ? `+${delta}%` : `${level * 20}`}</span></Row>
        ))}
      </section>
      <section className="space-y-1">
        <h3 className="text-sm font-semibold">Axes d'amélioration</h3>
        {rank.slice(-3).reverse().map(({ d, level }) => (
          <Row key={d.id} id={d.id}><span className="flex-1 truncate text-left text-xs">{d.name}</span>
            <span className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <i key={n} className="h-2.5 w-1.5 rounded-sm" style={{ background: n <= level ? domainColor(d.id) : "rgba(148,163,255,.15)" }} />)}</span></Row>
        ))}
      </section>
      <section className="space-y-1.5">
        <h3 className="text-sm font-semibold">Prochaines suggestions</h3>
        {nextSuggestions(child).map(({ q, s, i }) => (
          <button key={`${q.id}-${i}`} onClick={() => navigate(`/domaine/${q.domainId}`)} className="suggest-row" style={{ ["--c" as string]: domainColor(q.domainId) }} data-testid={`suggestion-${q.id}-${i}`}>
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-xs font-semibold">{s.title} · {q.title}</span><span className="text-[10px] text-muted-foreground">{q.term}</span></span>
            <span className="play-btn"><Play size={11} /></span>
          </button>
        ))}
      </section>
      <div className="flex flex-wrap gap-1.5">
        {list.map((b) => <span key={b.id} className={`badge px-2 py-1 ${b.earned ? "badge-on" : ""}`} title={`${b.label} — ${b.desc}`} data-testid={`badge-${b.id}`}>{b.earned ? <Award size={13} /> : <Lock size={11} />}</span>)}
      </div>
      <button className="btn-outline mt-auto w-full" onClick={() => navigate("/carte")} data-testid="overview-progress-card"><IdCard size={15} /> Carte de progrès à partager</button>
      <button className="btn-ai w-full justify-center" onClick={() => openAssistant(`Quelles sont les 3 priorités d'accompagnement pour ${child.name} en ce moment ?`)} data-testid="overview-ai-priorities"><Sparkles size={15} /> Priorités suggérées par l'IA</button>
    </aside>
  );
}
