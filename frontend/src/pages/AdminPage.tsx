import { useEffect, useState } from "react";
import { ShieldCheck, UserCheck, UserX, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send, type Child, type Role, type User } from "@/lib/api";
import { Portrait } from "@/components/layout/Portrait";
import { frDate } from "@/lib/icons";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { FACTORS } from "@/data/factors";

const itemName = (ref: string) => {
  const [kind, id] = ref.split(":");
  return kind === "domain" ? `domaine « ${DOMAINS.find((d) => d.id === id)?.name ?? id} »` : kind === "fragility" ? `fragilité « ${FRAGILITIES.find((f) => f.id === id)?.label ?? id} »`
    : kind === "factor" ? `facteur « ${FACTORS.find((f) => f.id === id)?.label ?? id} »` : kind === "roots" ? "racines de l'arbre" : ref;
};
const detailText = (l: { action: string; detail?: string }) =>
  !l.detail ? "" : l.action.startsWith("content.") ? itemName(l.detail) : l.action === "auth.login" ? `par ${l.detail === "email" ? "e-mail" : l.detail}` : l.detail;

interface Log { log_id: string; at: string; action: string; user_email?: string; role?: string; child_id?: string; detail?: string }
const ROLES: [Role, string][] = [["educator", "Éducateur / professionnel"], ["direction", "Direction / responsable"], ["parent", "Parent / famille (lecture seule)"], ["admin", "Administrateur de structure"], ["internal", "Équipe Enfance+"]];
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

const ACTIONS: Record<string, string> = {
  "auth.login": "Connexion", "auth.login_failed": "Échec de connexion", "auth.register": "Inscription", "auth.email_verified": "E-mail vérifié",
  "auth.logout": "Déconnexion", "admin.user_update": "Compte modifié (rôle / statut)", "admin.assign": "Attribution de dossier",
  "setup.admin_created": "Installation : compte admin créé", "content.update": "Contenu modifié", "content.reset": "Contenu remis par défaut", "child.create": "Dossier enfant créé",
  "auth.password_reset": "Mot de passe réinitialisé", "auth.reset_requested": "Demande de réinitialisation", "auth.session_revoked": "Session révoquée",
  "message.send": "Message envoyé", "message.thread_create": "Conversation créée", "message.thread_read": "Conversation lue",
};
const CHILD_ACTIONS: Record<string, Record<string, string>> = {
  "": { GET: "Dossier consulté", PUT: "Fiche enfant modifiée", DELETE: "Dossier supprimé" },
  notes: { POST: "Note ajoutée", PUT: "Note modifiée", DELETE: "Note supprimée" },
  observations: { POST: "Observation ajoutée", PUT: "Observation modifiée", DELETE: "Observation supprimée" },
  levels: { PUT: "Niveau de domaine modifié" }, quests: { POST: "Activité créée", PUT: "Étape d'activité mise à jour", DELETE: "Activité supprimée" },
  assistant: { POST: "Question à l'assistant IA", DELETE: "Historique IA effacé" }, shares: { POST: "Partage ajouté", DELETE: "Partage retiré" },
  avatar: { POST: "Avatar généré" }, events: { POST: "Rendez-vous ajouté", PUT: "Rendez-vous modifié", DELETE: "Rendez-vous supprimé" }, tree: { POST: "Arbre personnalisé généré", DELETE: "Arbre personnalisé retiré" },
};
const ROLE_FR: Record<string, string> = { admin: "admin", direction: "direction", educator: "éducateur", parent: "parent", internal: "Enfance+" };

export function actionLabel(action: string) {
  const [method, path] = action.split(" ");
  if (!path) return ACTIONS[action] ?? action;
  return CHILD_ACTIONS[path.split("/")[3] ?? ""]?.[method] ?? action;
}

function AuditLog() {
  const { profiles } = useApp();
  const [logs, setLogs] = useState<Log[]>([]);
  const [q, setQ] = useState("");
  useEffect(() => { api<Log[]>("/admin/audit?limit=1000").then(setLogs); }, []);
  const childName = (id?: string) => profiles.find((p) => p.child_id === id)?.name ?? id;
  const shown = logs.filter((l) => !q || `${actionLabel(l.action)} ${l.action} ${l.user_email} ${childName(l.child_id)} ${l.detail}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-2" data-testid="admin-audit">
      <input className="field" placeholder="Filtrer (action, personne, enfant)…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="audit-filter" />
      <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border">
        {shown.map((l) => (
          <p key={l.log_id} className="grid grid-cols-[130px_260px_1fr] gap-3 border-b border-border/60 px-3 py-2 text-xs" data-testid="audit-row">
            <span className="text-muted-foreground">{frDate(l.at)} {new Date(l.at).toLocaleTimeString("fr-FR").slice(0, 5)}</span>
            <span className="truncate">{l.user_email ?? "—"} {l.role && <span className="text-muted-foreground">({ROLE_FR[l.role] ?? l.role})</span>}</span>
            <span className="truncate" title={`${l.action} ${l.detail ?? ""}`}><b className="text-gold" data-testid="audit-action">{actionLabel(l.action)}</b>{l.child_id && ` · ${childName(l.child_id)}`}{detailText(l) && ` · ${detailText(l)}`}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

const TABS = [["accounts", "Comptes et rôles", Accounts], ["assign", "Attribution des dossiers", Assignments], ["content", "Contenus", ContentEditor], ["audit", "Historique des actions", AuditLog]] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("accounts");
  const Comp = TABS.find((t) => t[0] === tab)![2];
  return (
    <div className="page space-y-4" data-testid="admin-page">
      <section className="panel flex flex-wrap items-center gap-4 p-6">
        <span className="medal-lg"><ShieldCheck size={24} /></span>
        <div className="mr-auto"><p className="eyebrow">Espace structure</p><h1 className="font-display text-3xl font-semibold">Administration</h1>
          <p className="text-xs text-muted-foreground">Validez les comptes, attribuez les dossiers, modifiez les contenus et consultez l'historique de chaque action.</p></div>
        <button className="btn-outline" onClick={() => window.location.reload()}><RotateCcw size={14} /> Actualiser</button>
      </section>
      <div className="seg">{TABS.map(([id, label]) => <button key={id} className={`seg-btn ${tab === id ? "seg-on" : ""}`} onClick={() => setTab(id)} data-testid={`admin-tab-${id}`}>{label}</button>)}</div>
      <section className="panel p-5"><Comp /></section>
    </div>
  );
}
