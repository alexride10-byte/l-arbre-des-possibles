import { useEffect, useState, type ReactNode } from "react";
import { Printer, Star, Sprout, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { api } from "@/lib/api";
import { AuthImg, Portrait } from "@/components/layout/Portrait";
import { DOMAIN_ICON, domainColor, frDate, isoFromFr } from "@/lib/icons";
import { allQuests } from "@/lib/rpg";
import { PAINTED_TREE } from "@/lib/assets";
import { KINDS, type CalEvent } from "./CalendarPage";

interface Note { note_id: string; text: string; author_name: string; created_at: string }
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: string) => (d.includes("/") ? isoFromFr(d) : d);

const Block = ({ title, empty, children, testid }: { title: string; empty: boolean; children: ReactNode; testid: string }) => (
  <section className="space-y-2" data-testid={testid}>
    <h3 className="font-display text-lg font-semibold text-amber-200">{title}</h3>
    {empty ? <p className="text-sm text-slate-400">Rien à signaler ce mois-ci.</p> : children}
  </section>
);

export default function ReportPage() {
  const { child, observations } = useApp();
  const [month, setMonth] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${pad(n.getMonth() + 1)}`; });
  const [notes, setNotes] = useState<Note[]>([]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [y, m] = month.split("-").map(Number);
  const end = `${m === 12 ? y + 1 : y}-${pad(m === 12 ? 1 : m + 1)}`;
  useEffect(() => {
    if (!child) return;
    api<Note[]>(`/children/${child.child_id}/notes`).then(setNotes);
    api<CalEvent[]>(`/events?child_id=${child.child_id}&start=${month}-01&end=${end}-01`).then(setEvents);
  }, [child?.child_id, month]);
  if (!child) return null;
  const inMonth = (d: string) => iso(d).startsWith(month);
  const monthNotes = notes.filter((n) => inMonth(n.created_at));
  const monthObs = observations.filter((o) => inMonth(o.date));
  const steps = allQuests(child).flatMap((q) => q.steps.map((s, i) => ({ s, q, st: child.quest_steps[`${q.id}:${i}`] }))).filter((x) => x.st?.status === "fait" && inMonth(x.st.date));
  const delta = (id: string) => child.level_history.filter((h) => h.domain_id === id && inMonth(h.date)).reduce((a, h) => a + h.to - h.from, 0);
  const label = new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return (
    <div className="page space-y-4" data-testid="report-page">
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="mr-auto font-display text-2xl font-semibold">Rapport mensuel</h1>
        <input type="month" className="field h-10" style={{ width: 190 }} value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} data-testid="report-month-input" />
        <button className="btn-primary" onClick={() => window.print()} data-testid="report-print-button"><Printer size={15} /> Imprimer / PDF</button>
      </div>
      <article className="progress-card print-card mx-auto max-w-3xl space-y-6 p-8" data-testid="report-card">
        <header className="flex flex-col items-center gap-5 sm:flex-row">
          <div className="h-32 w-28 shrink-0 overflow-hidden rounded-2xl border-2 border-amber-300/60"><Portrait avatar={child.avatar} alt={child.name} /></div>
          <div className="flex-1 space-y-1">
            <p className="text-xs uppercase tracking-[0.25em] text-amber-200/80">Enfance+ · Rapport de suivi</p>
            <h2 className="font-display text-3xl font-bold" data-testid="report-child-name">{child.name}</h2>
            <p className="text-sm text-slate-300" data-testid="report-month-label">{label.charAt(0).toUpperCase() + label.slice(1)} · {child.age} ans {child.grade && `· ${child.grade}`}</p>
            <p className="text-[11px] text-slate-400">Document confidentiel — réservé à l'équipe et à la famille. Les éléments décrits sont des observations, pas des diagnostics.</p>
          </div>
          <AuthImg src={child.tree_image || PAINTED_TREE} alt="Arbre de vie" className="h-32 w-44 rounded-xl border border-white/10 object-cover" />
        </header>
        <Block title="L'arbre de développement" empty={false} testid="report-tree">
          <div className="grid gap-2 sm:grid-cols-2">
            {DOMAINS.map((d) => {
              const Icon = DOMAIN_ICON[d.id] ?? Sprout, l = child.levels[d.id] ?? 1, dl = delta(d.id);
              return (
                <div key={d.id} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2" data-testid={`report-domain-${d.id}`}>
                  <span className="medal-xs" style={{ ["--c" as string]: domainColor(d.id) }}><Icon size={12} /></span>
                  <span className="flex-1 truncate text-sm">{d.name}</span>
                  {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={13} className={n <= l ? "fill-amber-300 text-amber-300" : "text-slate-600"} />)}
                  {dl !== 0 && <span className={`flex items-center gap-0.5 text-[11px] ${dl > 0 ? "text-emerald-300" : "text-red-300"}`}><TrendingUp size={11} />{dl > 0 ? `+${dl}` : dl}</span>}
                </div>
              );
            })}
          </div>
        </Block>
        <Block title="Notes de suivi" empty={!monthNotes.length} testid="report-notes">
          {monthNotes.map((n) => <p key={n.note_id} className="text-sm"><span className="text-xs text-slate-400">{frDate(n.created_at)} · {n.author_name} — </span>{n.text}</p>)}
        </Block>
        <Block title="Observations" empty={!monthObs.length} testid="report-observations">
          {monthObs.map((o) => <p key={o.obs_id} className="text-sm"><span className="text-xs text-slate-400">{frDate(iso(o.date))} · {DOMAINS.find((d) => d.id === o.domain_id)?.name} — </span>{o.fact}</p>)}
        </Block>
        <Block title="Progrès et activités réalisées" empty={!steps.length} testid="report-steps">
          {steps.map(({ s, q }) => <p key={q.id + s.title} className="text-sm">✦ <b>{s.title}</b> — {q.title}</p>)}
        </Block>
        <Block title="Rendez-vous et réunions" empty={!events.length} testid="report-events">
          {events.map((e) => <p key={e.event_id} className="text-sm"><b>{frDate(e.start)} {e.start.slice(11, 16)}</b> · {KINDS[e.kind][0]} — {e.title}{e.location && ` (${e.location})`}</p>)}
        </Block>
        <footer className="text-[11px] text-slate-400">Généré le {frDate(new Date().toISOString())} avec Enfance+.</footer>
      </article>
    </div>
  );
}
