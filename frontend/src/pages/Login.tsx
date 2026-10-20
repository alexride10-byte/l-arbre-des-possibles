import { Sparkles, ShieldCheck, Swords, LineChart } from "lucide-react";
import { LifeTree } from "@/components/tree/LifeTree";
import { DEFAULT_AVATAR } from "@/components/layout/AvatarIllustration";
import { Logo } from "@/components/layout/Logo";

const noop = () => {};

export default function Login() {
  const signIn = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };
  const features = [
    [Swords, "Niveaux, quêtes et badges", "Une progression discrète, façon RPG, centrée sur l'enfant."],
    [LineChart, "Trajectoires possibles", "Comparer des scénarios illustratifs sur 5 ans."],
    [Sparkles, "Assistant IA bienveillant", "Pistes d'intervention et synthèses, sans diagnostic."],
    [ShieldCheck, "Plusieurs profils", "Pour les professionnels comme pour les parents."],
  ] as const;
  return (
    <main className="night-sky relative grid min-h-dvh overflow-hidden lg:grid-cols-[minmax(0,1fr)_480px]" data-testid="login-page">
      <div className="pointer-events-none absolute inset-0 opacity-70 lg:relative lg:opacity-100">
        <LifeTree avatar={DEFAULT_AVATAR} focusId={null} selectedNode={null} onFocus={noop} onNode={noop} onBack={noop} levelLabels={{}} />
      </div>
      <section className="relative z-10 m-4 flex flex-col justify-center gap-7 rounded-2xl border border-border bg-[var(--panel-bg)] p-8 backdrop-blur-xl lg:m-6">
        <Logo />
        <div className="space-y-3">
          <p className="eyebrow">Accompagner le développement de l'enfant</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">Chaque enfant est un arbre qui grandit à sa façon.</h1>
          <p className="text-sm text-muted-foreground">Observez, comprenez et agissez sur sept domaines du développement, avec un arbre de vie interactif.</p>
        </div>
        <ul className="space-y-4">
          {features.map(([Icon, t, d]) => (
            <li key={t} className="flex gap-3"><span className="medal-sm"><Icon size={16} /></span><div><p className="text-sm font-semibold">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div></li>
          ))}
        </ul>
        <button onClick={signIn} className="btn-primary h-12 text-base" data-testid="login-google-button">Continuer avec Google</button>
        <p className="text-[11px] text-muted-foreground">Outil d'aide à l'observation, il ne remplace pas l'avis d'un professionnel de santé. Évitez les données nominatives réelles en démonstration.</p>
      </section>
    </main>
  );
}
