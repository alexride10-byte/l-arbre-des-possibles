import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Save, Trash2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send } from "@/lib/api";

export interface CalEvent { event_id: string; child_id: string; child_name: string; title: string; kind: "rdv" | "reunion" | "autre"; start: string; duration: number; location: string; notes: string; created_by_name: string }
type Draft = Omit<CalEvent, "event_id" | "child_name" | "created_by_name"> & { event_id?: string };

export const KINDS = { rdv: ["Rendez-vous", "#38bdf8"], reunion: ["Réunion d'équipe", "#f5c46a"], autre: ["Autre", "#a78bfa"] } as const;
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function EventForm({ draft, onClose, onSaved, readOnly }: { draft: Draft; onClose: () => void; onSaved: () => void; readOnly: boolean }) {
  const { profiles } = useApp();
  const [d, setD] = useState(draft);
  const [err, setErr] = useState("");
  const set = (p: Partial<Draft>) => setD({ ...d, ...p });
  const base = `/children/${d.child_id}/events`;
  const body = { title: d.title, kind: d.kind, start: d.start, duration: d.duration, location: d.location, notes: d.notes };
  const save = async () => {
    try { await send(d.event_id ? `${base}/${d.event_id}` : base, d.event_id ? "PUT" : "POST", body); onSaved(); } catch (e) { setErr((e as Error).message); }
  };
  const remove = async () => {
    if (!window.confirm("Supprimer ce rendez-vous ?")) return;
    try { await send(`${base}/${d.event_id}`, "DELETE"); onSaved(); } catch (e) { setErr((e as Error).message); }
  };
  return (
    <section className="panel space-y-3 p-5" data-testid="event-form">
      <fieldset disabled={readOnly} className="contents">
      <div className="flex items-center"><h2 className="mr-auto font-display text-lg font-semibold">{readOnly ? "Détail du rendez-vous" : d.event_id ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="Fermer" data-testid="event-form-close"><X size={16} /></button></div>
      <label className="block text-xs text-muted-foreground">Enfant<select className="field mt-1" value={d.child_id} disabled={!!d.event_id} onChange={(e) => set({ child_id: e.target.value })} data-testid="event-child-select">
        {profiles.map((p) => <option key={p.child_id} value={p.child_id}>{p.name}</option>)}</select></label>
      <label className="block text-xs text-muted-foreground">Titre<input className="field mt-1" value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ex. Rencontre avec la famille" data-testid="event-title-input" /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted-foreground">Type<select className="field mt-1" value={d.kind} onChange={(e) => set({ kind: e.target.value as Draft["kind"] })} data-testid="event-kind-select">
          {Object.entries(KINDS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="text-xs text-muted-foreground">Durée (min)<input type="number" min={5} max={720} className="field mt-1" value={d.duration} onChange={(e) => set({ duration: Number(e.target.value) })} data-testid="event-duration-input" /></label>
        <label className="text-xs text-muted-foreground">Date<input type="date" className="field mt-1" value={d.start.slice(0, 10)} onChange={(e) => set({ start: `${e.target.value}T${d.start.slice(11, 16)}` })} data-testid="event-date-input" /></label>
        <label className="text-xs text-muted-foreground">Heure<input type="time" className="field mt-1" value={d.start.slice(11, 16)} onChange={(e) => set({ start: `${d.start.slice(0, 10)}T${e.target.value}` })} data-testid="event-time-input" /></label>
      </div>
      <label className="block text-xs text-muted-foreground">Lieu<input className="field mt-1" value={d.location} onChange={(e) => set({ location: e.target.value })} data-testid="event-location-input" /></label>
      <label className="block text-xs text-muted-foreground">Notes<textarea rows={2} className="field mt-1" value={d.notes} onChange={(e) => set({ notes: e.target.value })} data-testid="event-notes-input" /></label>
      </fieldset>
      {err && <p className="text-xs text-red-300" data-testid="event-error">{err}</p>}
      {readOnly ? <p className="text-xs text-amber-200" data-testid="event-readonly">Lecture seule · ajouté par {(draft as Partial<CalEvent>).created_by_name}</p> : <div className="flex gap-2">
        <button className="btn-primary" onClick={save} disabled={!d.title.trim()} data-testid="event-save-button"><Save size={15} /> Enregistrer</button>
        {d.event_id && <button className="btn-outline text-red-300" onClick={remove} data-testid="event-delete-button"><Trash2 size={14} /> Supprimer</button>}
      </div>}
    </section>
  );
}

export default function CalendarPage() {
  const { profiles, child, user } = useApp();
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const canWrite = user.role === "admin" || user.role === "educator";
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const load = () => api<CalEvent[]>(`/events?start=${ymd(month)}&end=${ymd(next)}${filter !== "all" ? `&child_id=${filter}` : ""}`).then(setEvents);
  useEffect(() => { load(); }, [month, filter]);
  const cells = useMemo(() => {
    const first = (month.getDay() + 6) % 7, days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((first + days) / 7) * 7 }, (_, i) => (i < first || i >= first + days ? null : new Date(month.getFullYear(), month.getMonth(), i - first + 1)));
  }, [month]);
  const newAt = (day: Date) => canWrite && setDraft({ child_id: filter !== "all" ? filter : child?.child_id ?? profiles[0]?.child_id, title: "", kind: "rdv", start: `${ymd(day)}T10:00`, duration: 60, location: "", notes: "" });
  const today = ymd(new Date());
  return (
    <div className="page grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" data-testid="calendar-page">
      <section className="panel space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="medal-lg"><CalendarDays size={20} /></span>
          <div className="mr-auto"><p className="eyebrow">Calendrier partagé</p>
            <h1 className="font-display text-2xl font-semibold capitalize" data-testid="calendar-month">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h1></div>
          <select className="field h-10" style={{ width: 190 }} value={filter} onChange={(e) => setFilter(e.target.value)} data-testid="calendar-child-filter">
            <option value="all">Tous les enfants</option>{profiles.map((p) => <option key={p.child_id} value={p.child_id}>{p.name}</option>)}</select>
          <button className="icon-btn" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mois précédent" data-testid="calendar-prev"><ChevronLeft size={18} /></button>
          <button className="icon-btn" onClick={() => setMonth(next)} aria-label="Mois suivant" data-testid="calendar-next"><ChevronRight size={18} /></button>
          {canWrite && <button className="btn-primary" onClick={() => newAt(new Date())} data-testid="calendar-add-button"><Plus size={15} /> Rendez-vous</button>}
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-widest text-muted-foreground">{DAYS.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => !day ? <span key={i} /> : (
            <div key={i} onClick={() => newAt(day)} className={`min-h-24 cursor-pointer rounded-lg border p-1.5 text-left transition-colors hover:bg-white/5 ${ymd(day) === today ? "border-amber-300/60" : "border-border/60"}`} data-testid={`calendar-day-${ymd(day)}`}>
              <p className="text-xs text-muted-foreground">{day.getDate()}</p>
              {events.filter((e) => e.start.startsWith(ymd(day))).map((e) => (
                <button key={e.event_id} onClick={(ev) => { ev.stopPropagation(); setDraft({ ...e }); }} className="mt-1 block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px]" style={{ background: `${KINDS[e.kind][1]}26`, borderLeft: `3px solid ${KINDS[e.kind][1]}` }} data-testid={`calendar-event-${e.event_id}`}>
                  {e.start.slice(11, 16)} {e.title} · {e.child_name}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">{Object.values(KINDS).map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{l}</span>)}</div>
      </section>
      {draft ? <EventForm key={draft.event_id ?? draft.start} readOnly={!canWrite} draft={draft} onClose={() => setDraft(null)} onSaved={() => { setDraft(null); load(); }} />
        : <section className="panel space-y-2 p-5" data-testid="calendar-upcoming"><h2 className="font-display text-lg font-semibold">Ce mois-ci</h2>
          {events.length === 0 && <p className="text-sm text-muted-foreground">Aucun rendez-vous.</p>}
          {events.map((e) => <button key={e.event_id} className="menu-item" onClick={() => setDraft({ ...e })}><span className="truncate"><b className="text-gold">{new Date(e.start).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} {e.start.slice(11, 16)}</b> {e.title}</span><span className="text-[11px] text-muted-foreground">{e.child_name}</span></button>)}
          {!canWrite && <p className="text-xs text-amber-200">Lecture seule.</p>}</section>}
    </div>
  );
}
