import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, Settings, Search, Sparkles, Menu, Compass, User, Network, Clock, Workflow, Library, LogOut, ShieldCheck, KeyRound, MessagesSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { useApp } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { allQuests, stepStatus } from "@/lib/rpg";
import { AiSettings } from "@/components/assistant/AiSettings";
import { InstallButton } from "./InstallButton";

const NAV = [
  ["/", "Vue d'ensemble", Compass], ["/enfants", "Enfants", User], ["/interventions", "Activités", Workflow],
  ["/chronologie", "Suivi", Clock], ["/futur", "Futur", Network], ["/ressources", "Ressources", Library],
] as const;

function SearchBox() {
  const { openDomain, openNode, openFrag } = useApp();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const items = useMemo(() => [
    ...DOMAINS.map((d) => ({ key: d.id, label: d.name, kind: "Domaine", go: () => openDomain(d.id) })),
    ...DOMAINS.flatMap((d) => d.nodes.map((n) => ({ key: n.id, label: n.label, kind: d.name, go: () => openNode(d.id, n.id) }))),
    ...FRAGILITIES.map((f) => ({ key: f.id, label: f.label, kind: "Défi", go: () => openFrag(f.id) })),
  ], [openDomain, openNode, openFrag]);
  const res = q.trim() ? items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8) : [];
  return (
    <div className="relative hidden xl:block">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="field h-10 w-56" style={{ paddingLeft: "2.2rem" }} data-testid="global-search-input" />
      {res.length > 0 && (
        <ul className="popover absolute right-0 top-12 z-50 w-72 p-1" data-testid="global-search-results">
          {res.map((r) => (
            <li key={r.key}><button className="menu-item" onClick={() => { r.go(); navigate("/"); setQ(""); }} data-testid={`search-result-${r.key}`}>
              <span>{r.label}</span><span className="text-[10px] text-muted-foreground">{r.kind}</span></button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Notifications() {
  const { child } = useApp();
  const [open, setOpen] = useState(false);
  const pending = child ? allQuests(child).flatMap((q) => q.steps.map((s, i) => ({ q, s, st: stepStatus(child, q.id, i, s.status) }))).filter((x) => x.st === "en cours") : [];
  return (
    <div className="relative">
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Notifications" data-testid="notifications-button">
        <Bell size={19} />{pending.length > 0 && <span className="notif-dot" />}
      </button>
      {open && (
        <div className="popover absolute right-0 top-12 z-50 w-80 space-y-2 p-3" data-testid="notifications-popover">
          <p className="eyebrow">Étapes en cours</p>
          {pending.length === 0 && <p className="text-xs text-muted-foreground">Aucune étape en cours.</p>}
          {pending.map(({ q, s }) => <p key={q.id + s.title} className="text-xs"><span className="text-gold">{s.title}</span> · {q.title}</p>)}
        </div>
      )}
    </div>
  );
}

function SettingsMenu() {
  const { user, setUser, logout } = useApp();
  const [open, setOpen] = useState(false);
  const setAudience = async (audience: "pro" | "parent") => {
    const { send } = await import("@/lib/api");
    setUser(await send("/auth/me", "PUT", { audience }));
  };
  return (
    <div className="relative">
      <button className="icon-btn" onClick={() => setOpen(!open)} aria-label="Réglages" data-testid="settings-button"><Settings size={19} /></button>
      {open && (
        <div className="popover absolute right-0 top-12 z-50 w-72 space-y-3 p-4" data-testid="settings-popover">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <Link to="/compte" className="menu-item" onClick={() => setOpen(false)} data-testid="settings-account-link"><span className="flex items-center gap-2"><KeyRound size={14} /> Mon compte et sessions</span></Link>
          <AiSettings />
          <p className="eyebrow pt-2">Je suis</p>
          <div className="grid grid-cols-2 gap-2">
            {(["pro", "parent"] as const).map((a) => (
              <button key={a} onClick={() => setAudience(a)} className={`chip ${user.audience === a ? "chip-active" : ""}`} data-testid={`audience-${a}`}>
                {a === "pro" ? "Professionnel" : "Parent"}</button>
            ))}
          </div>
          {user.auth_enabled === false
            ? <p className="text-[11px] text-muted-foreground" data-testid="auth-disabled-note">Connexion Google désactivée (mode démo).</p>
            : <button onClick={logout} className="menu-item text-red-300" data-testid="logout-button"><span className="flex items-center gap-2"><LogOut size={14} /> Se déconnecter</span></button>}
        </div>
      )}
    </div>
  );
}

function useUnread() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const f = () => api<{ unread: number }>("/messages/unread").then((r) => setN(r.unread)).catch(() => {});
    f(); const t = setInterval(f, 30000); window.addEventListener("messages-read", f);
    return () => { clearInterval(t); window.removeEventListener("messages-read", f); };
  }, []);
  return n;
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { user, openAssistant } = useApp();
  const unread = useUnread();
  return (
    <header className="topbar z-30 flex h-16 shrink-0 items-center gap-3 px-4 lg:px-5" data-testid="top-bar">
      <button className="icon-btn lg:hidden" onClick={onMenu} aria-label="Menu" data-testid="mobile-menu-button"><Menu size={20} /></button>
      <Logo />
      <nav className="ml-6 hidden items-center gap-1 2xl:ml-10 lg:flex" aria-label="Navigation principale">
        {[...(user.role === "internal" ? [["/interne", "Espace interne", Compass] as const] : NAV), ...(user.role === "admin" ? [["/admin", "Administration", ShieldCheck] as const] : [])].map(([to, label, Icon]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => `topnav-pill ${isActive ? "topnav-pill-active" : ""}`} data-testid={`topnav-${to === "/" ? "overview" : to.slice(1)}`}>
            <Icon size={16} /><span className="hidden xl:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-2">
        {user.role !== "internal" && <SearchBox />}
        {user.role !== "internal" && <button className="btn-ai" onClick={() => openAssistant()} data-testid="open-assistant-button"><Sparkles size={16} /><span className="hidden sm:inline">Assistant IA</span></button>}
        <NavLink to="/messages" className={({ isActive }) => `icon-btn ${isActive ? "text-foreground" : ""}`} aria-label="Messages" data-testid="topnav-messages"><MessagesSquare size={19} />{unread > 0 && <span className="unread-badge" data-testid="messages-unread-badge">{unread}</span>}</NavLink>
        {user.role !== "internal" && <Notifications />}
        <InstallButton />
        <SettingsMenu />
        {user.picture ? <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full border border-border" data-testid="user-avatar" />
          : <span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-sm" data-testid="user-avatar">{user.name[0]}</span>}
      </div>
    </header>
  );
}
