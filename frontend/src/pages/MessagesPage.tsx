import { useEffect, useRef, useState } from "react";
import { Lock, Plus, Send, MessagesSquare, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send } from "@/lib/api";
import { portraitSrc } from "@/components/layout/Portrait";
import { frDate } from "@/lib/icons";

interface Thread { thread_id: string; title: string; child_id?: string | null; child_name?: string; child_portrait?: string | null; participant_names: string[]; last_at: string; last_text: string; last_author?: string; unread: number }
interface Msg { msg_id: string; author_id: string; author_name: string; text: string; created_at: string }
interface Contact { user_id: string; name: string; role?: string | null }
const ROLE: Record<string, string> = { admin: "Admin", direction: "Direction", educator: "Éducateur", internal: "Équipe Enfance+" };
const time = (iso: string) => `${frDate(iso)} · ${new Date(iso).toLocaleTimeString("fr-FR").slice(0, 5)}`;

function NewThread({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const { child } = useApp();
  const [link, setLink] = useState(!!child);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [to, setTo] = useState<string[]>([]);
  const [f, setF] = useState({ title: "", text: "" });
  const [err, setErr] = useState("");
  useEffect(() => { api<Contact[]>(`/messages/contacts${link && child ? `?child_id=${child.child_id}` : ""}`).then((c) => { setContacts(c); setTo((t) => t.filter((x) => c.some((y) => y.user_id === x))); }); }, [link, child?.child_id]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    try { const t = await send<Thread>("/messages/threads", "POST", { ...f, participant_ids: to, child_id: link ? child?.child_id : null }); onDone(t.thread_id); }
    catch (e2) { setErr((e2 as Error).message); }
  };
  return (
    <form onSubmit={submit} className="flex h-full flex-col gap-3 p-5" data-testid="new-thread-form">
      <div className="flex items-center"><h2 className="mr-auto font-display text-xl font-semibold">Nouveau message</h2><button type="button" className="icon-btn h-8 w-8" onClick={onCancel} aria-label="Annuler" data-testid="new-thread-cancel"><X size={15} /></button></div>
      <input required className="field" placeholder="Objet" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} data-testid="new-thread-title" />
      {child && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} className="accent-amber-400" data-testid="new-thread-link-child" /> Lier au dossier de <b>{child.name}</b> <span className="text-xs text-muted-foreground">(seules les personnes ayant accès au dossier)</span></label>}
      <div><p className="mb-1.5 text-xs text-muted-foreground">Destinataires</p>
        <div className="flex flex-wrap gap-1.5">{contacts.map((c) => <button type="button" key={c.user_id} onClick={() => setTo(to.includes(c.user_id) ? to.filter((x) => x !== c.user_id) : [...to, c.user_id])} className={`chip ${to.includes(c.user_id) ? "chip-active" : ""}`} data-testid={`new-thread-to-${c.user_id}`}>{c.name} <span className="text-[10px] text-muted-foreground">{ROLE[c.role ?? ""]}</span></button>)}
          {contacts.length === 0 && <span className="text-xs text-muted-foreground">Aucun destinataire disponible.</span>}</div></div>
      <textarea required rows={6} className="field flex-1" placeholder="Votre message (évitez les informations non nécessaires sur l'enfant)" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} data-testid="new-thread-text" />
      {err && <p className="text-xs text-red-300" data-testid="new-thread-error">{err}</p>}
      <button className="btn-gold-solid" disabled={!to.length} data-testid="new-thread-submit"><Send size={15} /> Envoyer</button>
    </form>
  );
}

function Conversation({ id, onChange }: { id: string; onChange: () => void }) {
  const { user } = useApp();
  const [data, setData] = useState<{ thread: Thread; messages: Msg[] } | null>(null);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const load = () => api<{ thread: Thread; messages: Msg[] }>(`/messages/threads/${id}`).then(setData).catch((e) => setErr(e.message));
  useEffect(() => { load().then(onChange); const t = setInterval(load, 10000); return () => clearInterval(t); }, [id]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [data?.messages.length]);
  const post = async (e: React.FormEvent) => {
    e.preventDefault(); if (!text.trim()) return;
    try { await send(`/messages/threads/${id}/messages`, "POST", { text }); setText(""); await load(); onChange(); } catch (e2) { setErr((e2 as Error).message); }
  };
  if (err) return <p className="p-6 text-sm text-red-300" data-testid="thread-error">{err}</p>;
  if (!data) return null;
  return (
    <div className="flex h-full flex-col" data-testid="thread-view">
      <header className="border-b border-border p-4">
        <p className="font-display text-lg font-semibold" data-testid="thread-title">{data.thread.title}</p>
        <p className="text-xs text-muted-foreground">{data.thread.participant_names.join(", ")}</p>
      </header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {data.messages.map((m) => {
          const mine = m.author_id === user.user_id;
          return (
            <div key={m.msg_id} className={mine ? "bubble-user ml-16" : "bubble-ai mr-16"} data-testid="thread-message">
              <p className="mb-1 text-[11px] text-muted-foreground">{mine ? "Vous" : m.author_name} · {time(m.created_at)}</p>
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
            </div>
          );
        })}
        <div ref={end} />
      </div>
      <form onSubmit={post} className="flex gap-2 border-t border-border p-3">
        <input className="field h-11" placeholder="Répondre…" value={text} onChange={(e) => setText(e.target.value)} data-testid="thread-reply-input" />
        <button className="btn-primary h-11 w-12 shrink-0 px-0" aria-label="Envoyer" data-testid="thread-reply-send"><Send size={16} className="mx-auto" /></button>
      </form>
    </div>
  );
}

export default function MessagesPage() {
  const { child } = useApp();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [compose, setCompose] = useState(false);
  const [onlyChild, setOnlyChild] = useState(false);
  const load = () => api<Thread[]>(`/messages/threads${onlyChild && child ? `?child_id=${child.child_id}` : ""}`).then((t) => { setThreads(t); window.dispatchEvent(new Event("messages-read")); });
  useEffect(() => { load(); }, [onlyChild, child?.child_id]);
  return (
    <div className="page grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]" data-testid="messages-page">
      <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
        <div className="space-y-3 border-b border-border p-4">
          <div className="flex items-center gap-2"><MessagesSquare size={18} className="text-gold" /><h1 className="mr-auto font-display text-xl font-semibold">Messages</h1>
            <button className="btn-gold-solid h-9 px-3 text-xs" onClick={() => { setCompose(true); setSel(null); }} data-testid="new-thread-button"><Plus size={14} /> Nouveau</button></div>
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lock size={11} /> Échanges privés entre professionnels autorisés, tracés dans le journal des accès.</p>
          {child && <div className="seg w-full"><button className={`seg-btn flex-1 ${!onlyChild ? "seg-on" : ""}`} onClick={() => setOnlyChild(false)} data-testid="threads-filter-all">Tous</button><button className={`seg-btn flex-1 ${onlyChild ? "seg-on" : ""}`} onClick={() => setOnlyChild(true)} data-testid="threads-filter-child">Dossier de {child.name}</button></div>}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {threads.map((t) => (
            <li key={t.thread_id}><button onClick={() => { setSel(t.thread_id); setCompose(false); }} className={`thread-row ${sel === t.thread_id ? "thread-row-on" : ""}`} data-testid={`thread-${t.thread_id}`}>
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-border bg-muted">{t.child_portrait ? <img src={portraitSrc(t.child_portrait)!} alt="" className="h-full w-full object-cover" /> : <MessagesSquare size={18} className="m-3 text-muted-foreground" />}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold">{t.title}</span><span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{frDate(t.last_at)}</span></span>
                <span className="block truncate text-xs text-muted-foreground">{t.child_name && <span className="text-gold">{t.child_name} · </span>}{t.last_author}: {t.last_text}</span>
              </span>
              {t.unread > 0 && <span className="unread-dot" data-testid={`thread-unread-${t.thread_id}`}>{t.unread}</span>}
            </button></li>
          ))}
          {threads.length === 0 && <p className="p-5 text-sm text-muted-foreground">Aucune conversation.</p>}
        </ul>
      </section>
      <section className="panel min-h-[70vh] overflow-hidden">
        {compose ? <NewThread onCancel={() => setCompose(false)} onDone={(id) => { setCompose(false); setSel(id); load(); }} />
          : sel ? <Conversation key={sel} id={sel} onChange={load} />
          : <div className="grid h-full place-items-center p-8 text-center text-sm text-muted-foreground"><div><MessagesSquare size={40} className="mx-auto mb-3 text-gold/70" />Sélectionnez une conversation ou écrivez un nouveau message.</div></div>}
      </section>
    </div>
  );
}
