import { useState } from "react";
import { Share2, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { send, type Child } from "@/lib/api";

export function SharePanel() {
  const { child, user, saveChild } = useApp();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"parent" | "pro">("parent");
  const [error, setError] = useState("");
  if (!child) return null;
  const owner = child.user_id === user.user_id;
  const base = `/children/${child.child_id}/shares`;

  if (!owner) return (
    <section className="panel space-y-2 p-5" data-testid="share-panel">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Share2 size={17} /> Profil partagé</h2>
      <p className="text-sm text-muted-foreground">Ce profil vous est partagé par <b className="text-foreground">{child.owner_name}</b>. Vous pouvez observer, évaluer et suivre les quêtes ensemble.</p>
    </section>
  );
  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try { saveChild(await send<Child>(base, "POST", { email: email.trim(), role })); setEmail(""); }
    catch (err) { setError((err as Error).message); }
  };
  return (
    <section className="panel space-y-3 p-5" data-testid="share-panel">
      <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Share2 size={17} /> Suivre à plusieurs</h2>
      <p className="text-xs text-muted-foreground">Invitez un parent ou un professionnel avec son adresse Google : il verra ce profil dès sa connexion et pourra y contribuer.</p>
      <form onSubmit={add} className="space-y-2">
        <input type="email" required className="field" placeholder="adresse@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="share-email-input" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <select className="field" value={role} onChange={(e) => setRole(e.target.value as "parent" | "pro")} aria-label="Rôle" data-testid="share-role-select">
            <option value="parent">Parent</option><option value="pro">Professionnel</option>
          </select>
          <button className="btn-primary" type="submit" data-testid="share-submit-button">Partager</button>
        </div>
      </form>
      {error && <p className="text-xs text-red-300" data-testid="share-error">{error}</p>}
      <ul className="space-y-1.5">
        {(child.shares ?? []).map((s) => (
          <li key={s.email} className="profile-row" data-testid={`share-row-${s.email}`}>
            <span className="min-w-0 flex-1 truncate text-sm">{s.email}</span>
            <span className="pill-muted">{s.role === "parent" ? "Parent" : "Pro"}</span>
            <button className="icon-btn h-7 w-7" aria-label="Retirer" onClick={async () => saveChild(await send<Child>(`${base}/${encodeURIComponent(s.email)}`, "DELETE"))} data-testid={`share-remove-${s.email}`}><X size={13} /></button>
          </li>
        ))}
        {(child.shares ?? []).length === 0 && <p className="text-xs text-muted-foreground">Aucun partage pour l'instant.</p>}
      </ul>
    </section>
  );
}
