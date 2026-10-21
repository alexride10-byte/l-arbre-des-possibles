import { useEffect, useState } from "react";
import { Laptop, LogOut, ShieldCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send } from "@/lib/api";
import { frDate } from "@/lib/icons";

interface Session { session_id: string; created_at?: string; user_agent: string; ip?: string; current: boolean }
const ROLE: Record<string, string> = { admin: "Administrateur de structure", direction: "Direction", educator: "Éducateur / professionnel", internal: "Équipe Enfance+" };

export default function AccountPage() {
  const { user, logout } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const load = () => api<Session[]>("/auth/sessions").then(setSessions);
  useEffect(() => { load(); }, []);
  return (
    <div className="page grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]" data-testid="account-page">
      <section className="panel space-y-3 p-6">
        <p className="eyebrow">Mon compte</p>
        <h1 className="font-display text-2xl font-semibold">{user.name}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <p className="flex items-center gap-2 text-sm"><ShieldCheck size={15} className="text-gold" /> {ROLE[user.role ?? ""] ?? "Sans rôle"}</p>
        {user.auth_enabled === false && <p className="text-xs text-amber-200">Mode démo : connexion désactivée (AUTH_ENABLED=false).</p>}
        {user.auth_enabled !== false && <button className="btn-outline w-full" onClick={logout} data-testid="account-logout"><LogOut size={14} /> Se déconnecter</button>}
      </section>
      <section className="panel space-y-3 p-6" data-testid="sessions-panel">
        <h2 className="font-display text-xl font-semibold">Sessions actives</h2>
        <p className="text-xs text-muted-foreground">Fermez à distance toute session que vous ne reconnaissez pas.</p>
        {sessions.map((s) => (
          <div key={s.session_id} className="admin-row" data-testid={`session-${s.session_id}`}>
            <Laptop size={18} className="text-muted-foreground" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm">{s.user_agent || "Appareil inconnu"}</p><p className="text-xs text-muted-foreground">{s.created_at && frDate(s.created_at)} · {s.ip ?? "IP inconnue"}</p></div>
            {s.current ? <span className="pill-green">Cette session</span>
              : <button className="btn-outline h-8 text-xs" onClick={async () => { await send(`/auth/sessions/${s.session_id}`, "DELETE"); load(); }} data-testid={`session-revoke-${s.session_id}`}>Révoquer</button>}
          </div>
        ))}
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">Aucune session (mode démo).</p>}
      </section>
    </div>
  );
}
