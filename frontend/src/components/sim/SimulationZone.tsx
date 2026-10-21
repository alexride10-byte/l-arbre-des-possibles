import { HelpCircle } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApp } from "@/context/AppContext";
import { SCENARIOS, chartData, doneSteps } from "@/lib/rpg";

export function SimulationZone() {
  const { child, scenario, setScenario } = useApp();
  if (!child) return null;
  const data = chartData(child.levels, doneSteps(child));
  return (
    <section className="panel sim-zone flex min-h-0 flex-col p-4 pt-3" data-testid="simulation-zone">
      <h3 className="mb-2 flex items-center gap-2 whitespace-nowrap font-display text-base font-semibold">Trajectoires possibles
        <span title="Projection illustrative calculée à partir des niveaux actuels et des étapes réalisées. Ce n'est pas une prédiction."><HelpCircle size={15} className="text-muted-foreground" /></span>
      </h3>
      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex w-36 shrink-0 flex-col gap-1">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => setScenario(s.id)} className={`scenario-btn ${scenario === s.id ? "scenario-on" : ""}`} data-testid={`scenario-${s.id}`}>
              <span className="h-3 w-3 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />{s.label}
            </button>
          ))}
        </div>
        <div className="min-h-0 min-w-0 flex-1" data-testid="trajectory-chart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 16, left: -24, bottom: 0 }}>
              <CartesianGrid stroke="rgba(148,163,255,.08)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 11 }} axisLine={{ stroke: "rgba(148,163,255,.25)" }} tickLine={false} />
              <YAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "#0d1530", border: "1px solid rgba(120,150,255,.25)", borderRadius: 10, fontSize: 12 }} formatter={(v, n) => [`${v} %`, SCENARIOS.find((s) => s.id === n)?.label ?? n]} />
              <ReferenceLine x="Aujourd'hui" stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Maintenant", position: "top", fill: "#94a3b8", fontSize: 10 }} />
              {SCENARIOS.map((s) => (
                <Line key={s.id} type="monotone" dataKey={s.id} stroke={s.color} strokeWidth={scenario === s.id ? 3 : 1.5} strokeOpacity={scenario === s.id ? 1 : 0.55}
                  dot={{ r: scenario === s.id ? 4 : 3, fill: "#0b1226", stroke: s.color, strokeWidth: 2 }} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
