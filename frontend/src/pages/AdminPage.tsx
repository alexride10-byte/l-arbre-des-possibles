import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserX, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send, type Child, type Role, type User } from "@/lib/api";
import { Portrait } from "@/components/layout/Portrait";
import { frDate } from "@/lib/icons";

interface Log { log_id: string; at: string; action: string; user_email?: string; role?: string; child_id?: string; detail?: string }
const ROLES: [Role, string][] = [["educator", "Éducateur / professionnel"], ["direction", "Direction / responsable"], ["admin", "Administrateur de structure"], ["internal", "Équipe Enfance+"]];
const STATUS: Record<string, string> = { pending: "En attente", active: "Actif", revoked: "Révoqué" };

function Accounts() {
  const { user: me } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [err, setErr] = useState("");
  const load = () => api<User[]>("/admin/users").then(setUsers);
  useEffect(() => { load(); }, []);
  const update = async (u: User, patch: Partial<User>) => {
    setErr("");
    try { await send(`/admin/users/${u.user_id}`, "PUT", patch); await load(); } catch (e) { setErr((e as Error).message); }
  };
  const sorted = [...users].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  return (
    <div className="space-y-2" data-testid="admin-accounts">
      {err && <p className="text-sm text-red-300" data-testid="admin-error">{err}</p>}
      {sorted.map((u) => {
        const self = u.user_id === me.user_id; const role = roles[u.user_id] ?? u.role ?? "educator";
        return (
          <div key={u.user_id} className="admin-row" data-testid={`admin-user-${u.email}`}>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{u.name} {self && <span className="pill-muted">vous</span>}</p>
              <p className="truncate text-xs text-muted-foreground">{u.email} · {u.email_verified ? "e-mail vérifié" : "e-mail non vérifié"}</p></div>
            <span className={`status-pill status-${u.status}`}>{STATUS[u.status ?? "pending"]}</span>
            <select className="field h-9 w-52" value={role} disabled={self} onChange={(e) => { const r = e.target.value as Role; setRoles({ ...roles, [u.user_id]: r }); if (u.status === "active") update(u, { role: r }); }} aria-label="Rôle" data-testid={`admin-role-${u.email}`}>
              {ROLES.map(([r, l]) => <option key={r} value={r}>{l}</option>)}
            </select>
            {!self && u.status !== "active" && <button className="btn-primary h-9" onClick={() => update(u, { status: "active", role })} data-testid={`admin-approve-${u.email}`}><UserCheck size={14} /> {u.status === "revoked" ? "Réactiver" : "Valider"}</button>}
            {!self && u.status === "active" && <button className="btn-outline h-9 text-red-300" onClick={() => window.confirm(`Révoquer l'accès de ${u.name} ?`) && update(u, { status: "revoked" })} data-testid={`admin-revoke-${u.email}`}><UserX size={14} /> Révoquer</button>}
          </div>
        );
      })}
    </div>
  );
}

function Assignments() {
  const { profiles, reloadProfiles } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => { api<User[]>("/admin/users").then((u) => setUsers(u.filter((x) => x.status === "active" && x.role === "educator"))); }, []);
  const toggle = async (c: Child, uid: string) => {
    const cur = c.assigned ?? [];
    await send(`/admin/children/${c.child_id}/assign`, "PUT", { user_ids: cur.includes(uid) ? cur.filter((x) => x !== uid) : [...cur, uid] });
    reloadProfiles();
  };
  return (
    <div className="grid gap-3 md:grid-cols-2" data-testid="admin-assignments">
      {profiles.map((c) => (
        <div key={c.child_id} className="admin-row items-start" data-testid={`assign-child-${c.child_id}`}>
          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-xl"><Portrait avatar={c.avatar} alt={c.name} /></span>
          <div className="flex-1 space-y-1.5"><p className="text-sm font-semibold">{c.name} · {c.age} ans</p>
            <div className="flex flex-wrap gap-1.5">{users.map((u) => (
              <button key={u.user_id} onClick={() => toggle(c, u.user_id)} className={`chip ${(c.assigned ?? []).includes(u.user_id) ? "chip-active" : ""}`} data-testid={`assign-${c.child_id}-${u.email}`}>{u.name}</button>
            ))}{users.length === 0 && <span className="text-xs text-muted-foreground">Aucun éducateur actif.</span>}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditLog() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { api<Log[]>("/admin/audit").then(setLogs); }, []);
  const shown = logs.filter((l) => !q || `${l.action} ${l.user_email} ${l.child_id}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2" data-testid="admin-audit">
      <input className="field" placeholder="Filtrer (action, e-mail, dossier)…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="audit-filter" />
      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border">
        {shown.map((l) => (
          <p key={l.log_id} className="grid grid-cols-[150px_200px_1fr] gap-3 border-b border-border/60 px-3 py-2 text-xs" data-testid="audit-row">
            <span className="text-muted-foreground">{frDate(l.at)} {new Date(l.at).toLocaleTimeString("fr-FR").slice(0, 5)}</span>
            <span className="truncate">{l.user_email ?? "—"} {l.role && <span className="text-muted-foreground">({l.role})</span>}</span>
            <span className="truncate"><b className="text-gold">{l.action}</b>{l.child_id && ` · ${l.child_id}`}{l.detail && ` · ${l.detail}`}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

const TABS = [["accounts", "Comptes et rôles", Accounts], ["assign", "Attribution des dossiers", Assignments], ["audit", "Journal des accès", AuditLog]] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("accounts");
  const Comp = TABS.find((t) => t[0] === tab)![2];
  return (
    <div className="page space-y-4" data-testid="admin-page">
      <section className="panel flex flex-wrap items-center gap-4 p-6">
        <span className="medal-lg"><ShieldCheck size={24} /></span>
        <div className="mr-auto"><p className="eyebrow">Espace structure</p><h1 className="font-display text-3xl font-semibold">Administration</h1>
          <p className="text-xs text-muted-foreground">Validez les comptes, attribuez les dossiers et contrôlez chaque accès aux données sensibles.</p></div>
        <button className="btn-outline" onClick={() => window.location.reload()}><RotateCcw size={14} /> Actualiser</button>
      </section>
      <div className="seg">{TABS.map(([id, label]) => <button key={id} className={`seg-btn ${tab === id ? "seg-on" : ""}`} onClick={() => setTab(id)} data-testid={`admin-tab-${id}`}>{label}</button>)}</div>
      <section className="panel p-5"><Comp /></section>
    </div>
  );
}
