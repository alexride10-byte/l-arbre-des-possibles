import { useState, type ReactNode } from "react";
import { Eye, EyeOff, MailCheck, ShieldCheck, Clock3, Ban } from "lucide-react";
import { send, setToken, type User } from "@/lib/api";
import { HERO, LOGIN_PORTRAIT } from "@/lib/assets";

type Mode = "login" | "register" | "forgot" | "sent" | "reset";

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page" data-testid="auth-page">
      <section className="auth-hero" style={{ backgroundImage: `url(${HERO})` }}>
        <div className="auth-hero-text">
          <h1 className="font-display text-6xl font-bold xl:text-7xl">Enfance<span className="text-gold">+</span></h1>
          <p className="mt-2 text-sm uppercase tracking-[0.3em] text-slate-200">Plateforme d'accompagnement éducatif</p>
          <p className="mt-6 text-xs uppercase tracking-[0.35em] text-amber-200">Soutenir aujourd'hui · Révéler demain</p>
        </div>
      </section>
      <section className="auth-side">
        <div className="auth-card panel-enter">{children}</div>
      </section>
    </main>
  );
}

function Field({ label, ...p }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="block text-xs text-muted-foreground">{label}<input className="field mt-1 h-11" {...p} /></label>;
}

function Password({ value, onChange, testid }: { value: string; onChange: (v: string) => void; testid: string }) {
  const [show, setShow] = useState(false);
  return (
    <label className="block text-xs text-muted-foreground">Mot de passe
      <span className="relative mt-1 block">
        <input type={show ? "text" : "password"} required minLength={8} value={value} onChange={(e) => onChange(e.target.value)} placeholder="8 caractères minimum" className="field h-11 pr-10" data-testid={testid} />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Afficher le mot de passe" data-testid={`${testid}-toggle`}>{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
      </span>
    </label>
  );
}

export default function Login({ initial = "login" }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [f, setF] = useState({ name: "", email: "", password: "", accept: false });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  const run = async (fn: () => Promise<void>) => {
    setError(""); setBusy(true);
    try { await fn(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const go = (m: Mode) => { setMode(m); setError(""); setInfo(""); window.history.replaceState(null, "", "/"); };

  const login = () => run(async () => {
    const r = await send<User & { session_token: string }>("/auth/login", "POST", { email: f.email, password: f.password });
    setToken(r.session_token); window.location.href = "/";
  });
  const register = () => run(async () => {
    await send("/auth/register", "POST", { name: f.name, email: f.email, password: f.password, accept_terms: f.accept });
    setMode("sent");
  });
  const forgot = () => run(async () => {
    await send("/auth/forgot-password", "POST", { email: f.email });
    setInfo("Demande enregistrée. Contactez l'administrateur de votre structure : il peut vous créer un lien de réinitialisation depuis l'espace Administration.");
  });
  const reset = () => run(async () => {
    await send("/auth/reset-password", "POST", { token, password: f.password });
    go("login"); setInfo("Mot de passe modifié. Toutes vos sessions ont été fermées : reconnectez-vous.");
  });
  const submit = (e: React.FormEvent) => { e.preventDefault(); ({ login, register, forgot, reset } as Record<string, () => void>)[mode]?.(); };

  return (
    <Shell>
      {mode !== "sent" && <img src={LOGIN_PORTRAIT} alt="" className="auth-portrait" />}
      {mode === "sent" ? (
        <div className="space-y-4 text-center" data-testid="auth-verify-screen">
          <MailCheck size={56} className="mx-auto text-sky-300 drop-shadow-[0_0_18px_rgba(56,189,248,.8)]" />
          <h2 className="font-display text-2xl font-semibold">Compte créé</h2>
          <p className="text-sm text-muted-foreground">Votre compte <b className="text-foreground">{f.email}</b> est enregistré. L'administrateur de votre structure doit maintenant valider votre accès et votre rôle. Vous pourrez ensuite vous connecter.</p>
          <button className="text-sm text-sky-300 underline" onClick={() => go("login")} data-testid="auth-back-login">Retour à la connexion</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <h2 className="text-center font-display text-2xl font-semibold" data-testid="auth-title">
            {{ login: "Bienvenue sur Enfance+", register: "Créer votre compte", forgot: "Mot de passe oublié", reset: "Nouveau mot de passe" }[mode]}
          </h2>
          {mode === "login" && <p className="text-center text-xs text-muted-foreground">Votre espace d'accompagnement éducatif pour révéler le potentiel de chaque enfant.</p>}
          {mode === "register" && <Field label="Nom et prénom" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Votre nom et prénom" data-testid="auth-name-input" />}
          {mode !== "reset" && <Field label="Adresse e-mail" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="vous@exemple.fr" data-testid="auth-email-input" />}
          {mode !== "forgot" && <Password value={f.password} onChange={(v) => setF({ ...f, password: v })} testid="auth-password-input" />}
          {mode === "register" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={f.accept} onChange={(e) => setF({ ...f, accept: e.target.checked })} className="mt-0.5 accent-amber-400" data-testid="auth-terms-checkbox" />
              J'accepte les conditions d'utilisation et la politique de confidentialité (données des enfants protégées, accès tracés).
            </label>
          )}
          {error && <p className="text-sm text-red-300" data-testid="auth-error">{error}</p>}
          {info && <p className="text-sm text-emerald-300" data-testid="auth-info">{info}</p>}
          <button type="submit" disabled={busy || (mode === "register" && !f.accept)} className="btn-gold-solid w-full" data-testid="auth-submit-button">
            {busy ? "…" : { login: "Se connecter", register: "Créer mon compte", forgot: "Demander un nouveau mot de passe", reset: "Enregistrer" }[mode]}
          </button>
          <div className="space-y-1 text-center text-xs text-muted-foreground">
            {mode === "login" && <><p>Pas encore de compte ? <button type="button" className="text-sky-300 underline" onClick={() => go("register")} data-testid="auth-go-register">Créer un compte</button></p>
              <button type="button" className="text-sky-300 underline" onClick={() => go("forgot")} data-testid="auth-go-forgot">Mot de passe oublié ?</button></>}
            {mode !== "login" && <p>Déjà un compte ? <button type="button" className="text-sky-300 underline" onClick={() => go("login")} data-testid="auth-go-login">Se connecter</button></p>}
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/80"><ShieldCheck size={12} /> L'inscription ne donne aucun accès aux dossiers : la structure valide chaque compte.</p>
        </form>
      )}
    </Shell>
  );
}

export function PendingScreen({ user }: { user: User }) {
  const revoked = user.status === "revoked";
  const logout = async () => { await send("/auth/logout", "POST"); setToken(null); window.location.href = "/"; };
  return (
    <Shell>
      <div className="space-y-4 text-center" data-testid="pending-screen">
        {revoked ? <Ban size={52} className="mx-auto text-red-300" /> : <Clock3 size={52} className="mx-auto text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,.7)]" />}
        <h2 className="font-display text-2xl font-semibold">{revoked ? "Accès révoqué" : "Compte en attente de validation"}</h2>
        <p className="text-sm text-muted-foreground">
          {revoked ? "Votre accès a été retiré par la structure. Contactez votre administrateur." : <>Bonjour {user.name}, votre compte <b className="text-foreground">{user.email}</b> est créé. L'administrateur de votre structure doit maintenant valider votre rôle et vous attribuer les dossiers des enfants.</>}
        </p>
        <button className="btn-outline w-full" onClick={() => window.location.reload()} data-testid="pending-refresh">Vérifier à nouveau</button>
        <button className="text-sm text-sky-300 underline" onClick={logout} data-testid="pending-logout">Se déconnecter</button>
      </div>
    </Shell>
  );
}

export function SetupScreen() {
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", demo: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError("Les deux mots de passe ne correspondent pas");
    setError(""); setBusy(true);
    try {
      const r = await send<User & { session_token: string }>("/setup", "POST", { name: f.name, email: f.email, password: f.password, demo: f.demo });
      setToken(r.session_token); window.location.href = "/";
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <Shell>
      <form onSubmit={submit} className="space-y-3.5" data-testid="setup-screen">
        <ShieldCheck size={48} className="mx-auto text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,.7)]" />
        <h2 className="text-center font-display text-2xl font-semibold">Installation d'Enfance+</h2>
        <p className="text-center text-xs text-muted-foreground">Créez le compte administrateur de votre structure. Cet écran n'apparaît qu'une seule fois.</p>
        <Field label="Nom et prénom" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Votre nom et prénom" data-testid="setup-name-input" />
        <Field label="Adresse e-mail" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="vous@exemple.fr" data-testid="setup-email-input" />
        <Password value={f.password} onChange={(v) => setF({ ...f, password: v })} testid="setup-password-input" />
        <Field label="Confirmer le mot de passe" type="password" required minLength={8} value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} data-testid="setup-confirm-input" />
        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={f.demo} onChange={(e) => setF({ ...f, demo: e.target.checked })} className="mt-0.5 accent-amber-400" data-testid="setup-demo-checkbox" />
          Ajouter les données de démonstration (enfants et comptes fictifs) pour découvrir l'application.
        </label>
        {error && <p className="text-sm text-red-300" data-testid="setup-error">{error}</p>}
        <button type="submit" disabled={busy} className="btn-gold-solid w-full" data-testid="setup-submit-button">{busy ? "…" : "Créer le compte administrateur"}</button>
      </form>
    </Shell>
  );
}
