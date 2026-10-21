import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import type { Child } from "@/lib/api";

const COLORS: Record<string, string> = { emotionnel: "#fbbf24", social: "#c084fc", cognitif: "#38bdf8", scolaire: "#fb923c", sante: "#fb7185", autonomie: "#4ade80", environnement: "#2dd4bf" };

export function monthlySeries(child: Child) {
  const hist = [...child.level_history].sort((a, b) => a.date.localeCompare(b.date));
  const now = new Date();
  return Array.from({ length: 12 }, (_, k) => {
    const end = new Date(now.getFullYear(), now.getMonth() - 11 + k + 1, 1);
    const row: Record<string, string | number> = { label: new Date(end.getTime() - 86400000).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "") };
    for (const d of DOMAINS) {
      const past = hist.filter((h) => h.domain_id === d.id && new Date(h.date) < end);
      row[d.id] = (past.length ? past[past.length - 1]!.to : hist.find((h) => h.domain_id === d.id)?.from ?? child.levels[d.id] ?? 1) * 20;
    }
    return row;
  });
}

export function ProgressionChart() {
  const { child } = useApp();
  const [focus, setFocus] = useState("all");
  if (!child) return null;
  const data = monthlySeries(child);
  const shown = DOMAINS.filter((d) => focus === "all" || d.id === focus);
  const fictional = child.level_history.some((h) => (h as { fictional?: boolean }).fictional);
  return (
    <section className="panel flex min-h-0 flex-col p-4 pt-3" data-testid="progression-chart">
      <div className="mb-1 flex items-center gap-2">
        <div className="mr-auto"><h3 className="whitespace-nowrap font-display text-base font-semibold">Progression par domaine</h3>
          <p className="text-[10px] text-muted-foreground">Sur les 12 derniers mois{fictional && " · historique de démonstration fictif"}</p></div>
        <select value={focus} onChange={(e) => setFocus(e.target.value)} className="field h-8 text-xs" style={{ width: 170 }} aria-label="Domaine" data-testid="progression-domain-select">
          <option value="all">Tous les domaines</option>{DOMAINS.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="min-h-0 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 6, left: -28, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,255,.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 9 }} tickLine={false} axisLine={{ stroke: "rgba(148,163,255,.2)" }} interval={0} />
              <YAxis domain={[0, 100]} ticks={[25, 50, 75, 100]} tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1530", border: "1px solid rgba(120,150,255,.25)", borderRadius: 10, fontSize: 11 }} formatter={(v, n) => [`${v}`, DOMAINS.find((d) => d.id === n)?.name ?? n]} />
              {shown.map((d) => <Line key={d.id} type="monotone" dataKey={d.id} stroke={COLORS[d.id]} strokeWidth={focus === "all" ? 1.8 : 3} dot={{ r: 2, fill: COLORS[d.id] }} isAnimationActive={false} />)}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-32 shrink-0 space-y-0.5 overflow-y-auto" data-testid="progression-legend">
          {DOMAINS.map((d) => (
            <li key={d.id}><button onClick={() => setFocus(focus === d.id ? "all" : d.id)} className={`flex w-full items-center gap-1.5 rounded px-1 text-[11px] ${focus === d.id ? "bg-white/10" : ""}`} data-testid={`progression-legend-${d.id}`}>
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[d.id], boxShadow: `0 0 6px ${COLORS[d.id]}` }} /><span className="flex-1 truncate text-left">{d.name.split(" ")[0]}</span><b>{(child.levels[d.id] ?? 1) * 20}</b>
            </button></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
