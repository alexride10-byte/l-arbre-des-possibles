import { useEffect, useState, type ReactNode } from "react";
import { Eye, EyeOff, MailCheck, ShieldCheck, Clock3, Ban } from "lucide-react";
import { api, send, setToken, type User } from "@/lib/api";
import { HERO, LOGIN_PORTRAIT } from "@/lib/assets";

type Mode = "login" | "register" | "forgot" | "sent" | "reset" | "verify";

const googleSignIn = () => {
  // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
  const redirectUrl = window.location.origin + "/";
  window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
};

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

const GoogleBtn = ({ label }: { label: string }) => (
  <button type="button" onClick={googleSignIn} className="btn-google" data-testid="auth-google-button">
    <svg viewBox="0 0 48 48" className="h-5 w-5"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" /></svg>
    {label}
  </button>
);

const Or = () => <div className="flex items-center gap-3 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" />OU<span className="h-px flex-1 bg-border" /></div>;

function SimLink({ link }: { link?: string | null }) {
  if (!link) return null;
  return (
    <div className="rounded-lg border border-amber-300/40 bg-amber-300/10 p-3 text-xs" data-testid="simulated-email">
      <p className="mb-1 font-semibold text-amber-200">E-mail SIMULÉ (MVP, aucun envoi réel)</p>
      <a href={link} className="break-all text-sky-300 underline" data-testid="simulated-email-link">{window.location.origin}{link}</a>
    </div>
  );
}

export default function Login({ initial = "login" }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [f, setF] = useState({ name: "", email: "", password: "", accept: false });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") ?? "";

  useEffect(() => {
    if (initial !== "verify") return;
    send("/auth/verify-email", "POST", { token }).then(() => setInfo("Adresse vérifiée ! Vous pouvez vous connecter.")).catch((e) => setError(e.message));
  }, [initial, token]);

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
    const r = await send<{ simulated_link?: string }>("/auth/register", "POST", { name: f.name, email: f.email, password: f.password, accept_terms: f.accept });
    setLink(r.simulated_link ?? null); setMode("sent");
  });
  const forgot = () => run(async () => {
    const r = await send<{ simulated_link?: string }>("/auth/forgot-password", "POST", { email: f.email });
    setLink(r.simulated_link ?? null); setInfo("Si un compte existe, un lien de réinitialisation a été envoyé.");
  });
  const reset = () => run(async () => {
    await send("/auth/reset-password", "POST", { token, password: f.password });
    go("login"); setInfo("Mot de passe modifié. Toutes vos sessions ont été fermées : reconnectez-vous.");
  });
  const resend = () => run(async () => { const r = await send<{ simulated_link?: string }>("/auth/resend-verification", "POST", { email: f.email }); setLink(r.simulated_link ?? null); });
  const submit = (e: React.FormEvent) => { e.preventDefault(); ({ login, register, forgot, reset } as Record<string, () => void>)[mode]?.(); };

  return (
    <Shell>
      {mode !== "sent" && mode !== "verify" && <img src={LOGIN_PORTRAIT} alt="" className="auth-portrait" />}
      {mode === "sent" || mode === "verify" ? (
        <div className="space-y-4 text-center" data-testid="auth-verify-screen">
          <MailCheck size={56} className="mx-auto text-sky-300 drop-shadow-[0_0_18px_rgba(56,189,248,.8)]" />
          <h2 className="font-display text-2xl font-semibold">{mode === "sent" ? "Vérifiez votre boîte e-mail" : "Vérification de l'adresse"}</h2>
          {mode === "sent" && <p className="text-sm text-muted-foreground">Un lien de validation a été envoyé à <b className="text-foreground">{f.email}</b>. Ensuite, l'administrateur de votre structure devra valider votre accès.</p>}
          <SimLink link={link} />
          {mode === "sent" && <button className="btn-outline w-full" onClick={resend} disabled={busy} data-testid="auth-resend-button">Renvoyer l'e-mail</button>}
          {info && <p className="text-sm text-emerald-300" data-testid="auth-info">{info}</p>}
          {error && <p className="text-sm text-red-300" data-testid="auth-error">{error}</p>}
          <button className="text-sm text-sky-300 underline" onClick={() => go("login")} data-testid="auth-back-login">Retour à la connexion</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          <h2 className="text-center font-display text-2xl font-semibold" data-testid="auth-title">
            {{ login: "Bienvenue sur Enfance+", register: "Créer votre compte", forgot: "Mot de passe oublié", reset: "Nouveau mot de passe" }[mode]}
          </h2>
          {mode === "login" && <p className="text-center text-xs text-muted-foreground">Votre espace d'accompagnement éducatif pour révéler le potentiel de chaque enfant.</p>}
          {(mode === "login" || mode === "register") && <><GoogleBtn label={mode === "login" ? "Continuer avec Google" : "S'inscrire avec Google"} /><Or /></>}
          {mode === "register" && <Field label="Nom et prénom" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Votre nom et prénom" data-testid="auth-name-input" />}
          {mode !== "reset" && <Field label="Adresse e-mail" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="vous@exemple.fr" data-testid="auth-email-input" />}
          {mode !== "forgot" && <Password value={f.password} onChange={(v) => setF({ ...f, password: v })} testid="auth-password-input" />}
          {mode === "register" && (
            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={f.accept} onChange={(e) => setF({ ...f, accept: e.target.checked })} className="mt-0.5 accent-amber-400" data-testid="auth-terms-checkbox" />
              J'accepte les conditions d'utilisation et la politique de confidentialité (données des enfants protégées, accès tracés).
            </label>
          )}
          {error && <p className="text-sm text-red-300" data-testid="auth-error">{error}{error.includes("non vérifiée") && <button type="button" onClick={resend} className="ml-2 underline">Renvoyer le lien</button>}</p>}
          {info && <p className="text-sm text-emerald-300" data-testid="auth-info">{info}</p>}
          <SimLink link={link} />
          <button type="submit" disabled={busy || (mode === "register" && !f.accept)} className="btn-gold-solid w-full" data-testid="auth-submit-button">
            {busy ? "…" : { login: "Se connecter", register: "Créer mon compte", forgot: "Envoyer le lien", reset: "Enregistrer" }[mode]}
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
  const [f, setF] = useState({ name: "", email: "", password: "", confirm: "", demo: false, code: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeRequired, setCodeRequired] = useState(false);
  useEffect(() => { api<{ code_required?: boolean }>("/setup/status").then((r) => setCodeRequired(!!r.code_required)).catch(() => {}); }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) return setError("Les deux mots de passe ne correspondent pas");
    setError(""); setBusy(true);
    try {
      const r = await send<User & { session_token: string }>("/setup", "POST", { name: f.name, email: f.email, password: f.password, demo: f.demo, code: f.code });
      setToken(r.session_token); window.location.href = "/";
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <Shell>
      <form onSubmit={submit} className="space-y-3.5" data-testid="setup-screen">
        <ShieldCheck size={48} className="mx-auto text-amber-300 drop-shadow-[0_0_18px_rgba(251,191,36,.7)]" />
        <h2 className="text-center font-display text-2xl font-semibold">Installation d'Enfance+</h2>
        <p className="text-center text-xs text-muted-foreground">Créez le compte administrateur de votre structure. Cet écran n'apparaît qu'une seule fois.</p>
        {codeRequired && <Field label="Code d'installation (SETUP_CODE sur Render)" required autoComplete="off" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} data-testid="setup-code-input" />}
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
