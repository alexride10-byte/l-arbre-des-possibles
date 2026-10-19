import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DOMAINS } from "@/data/domains";
import { LifeTree } from "@/components/tree/LifeTree";
import { DomainPanel } from "@/components/tree/DomainPanel";
import { FragilityPanel } from "@/components/tree/FragilityPanel";
import { ProfileSidebar } from "@/components/layout/ProfileSidebar";
import { FollowUpZone } from "@/components/layout/FollowUpZone";
import { FactorPanel } from "@/components/tree/FactorPanel";
import { FACTORS } from "@/data/factors";
import { Button } from "@/components/ui/button";
import { AvatarCustomizer } from "@/components/layout/AvatarCustomizer";
import { DEFAULT_AVATAR, type AvatarOptions } from "@/components/layout/AvatarIllustration";
import { ArrowLeft, Compass, Heart, ShieldCheck, User, Clock } from "lucide-react";
import { FRAGILITIES } from "@/data/fragilities";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Enfance+ — L'arbre de vie de l'accompagnement" },
      { name: "description", content: "Explorez les sept domaines du développement de l'enfant à travers un arbre de vie interactif, pour les professionnels de l'enfance." },
      { property: "og:title", content: "Enfance+ — L'arbre de vie de l'accompagnement" },
      { property: "og:description", content: "Un outil immersif pour observer, comprendre et accompagner l'enfant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});


function Index() {
  const [avatar, setAvatar] = useState<AvatarOptions>(DEFAULT_AVATAR);
  const [avatarEditor, setAvatarEditor] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [node, setNode] = useState<string | null>(null);
  const [frag, setFrag] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const factor = FACTORS.find((f) => f.id === factorId);
  const [hidden, setHidden] = useState<string[]>([]);
  const [drawer, setDrawer] = useState<null | "profil" | "suivi">(null);
  const domain = DOMAINS.find((d) => d.id === focus);
  const fragility = FRAGILITIES.find((f) => f.id === frag);
  const selected = !!(domain || fragility);

  const back = () => { setFocus(null); setNode(null); setFrag(null); setFactorId(null); };
  const open = (id: string) => { setFactorId(null); setFrag(null); setFocus(id); setNode(null); setHidden((h) => h.filter((x) => x !== id)); setDrawer(null); };
  const openFrag = (id: string) => { setFocus(null); setNode(null); setFrag(id); setFactorId(null); setDrawer(null); };
  const toggle = (id: string) => setHidden((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { if (avatarEditor) setAvatarEditor(false); else { back(); setDrawer(null); } } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [avatarEditor]);

  const details = domain ? <DomainPanel key={domain.id} domain={domain} selectedNode={node} onNode={setNode} onBack={back} onFragility={openFrag} /> : factor ? <FactorPanel factor={factor} onNetwork={() => setFactorId(null)} onBack={back} /> : fragility ? <FragilityPanel key={fragility.id} f={fragility} onBack={back} onDomain={open} onFactor={setFactorId} /> : null;
  const profile = <ProfileSidebar hidden={hidden} onToggle={toggle} onOpen={open} avatar={avatar} onAvatar={() => setAvatarEditor(true)} />;
  return (
    <main className="night-sky app-shell flex h-dvh w-full flex-col overflow-hidden">
      <header className="app-header z-20 grid h-16 shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 px-4 lg:flex lg:px-6">
        <h1 className="min-w-0 font-display text-3xl text-foreground">Enfance<span className="text-gold">+</span></h1>
        <nav aria-label="Navigation principale" className="ml-6 hidden min-w-0 items-center gap-1 lg:flex">
          <Button variant="ghost" size="sm" onClick={back}><Compass /> Vue d'ensemble</Button>
          <Button variant="ghost" size="sm" onClick={() => setAvatarEditor(true)}><User /> Profil</Button>
          <Button variant="ghost" size="sm" onClick={() => setDrawer("suivi")}><Clock /> Chronologie et parcours</Button>
        </nav>
        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          {selected ? <Button variant="outline" size="sm" onClick={back} aria-label="Revenir à l'arbre complet"><ArrowLeft /> Arbre complet</Button> : <><Button variant="ghost" size="sm" onClick={() => setDrawer("profil")}>Profil</Button><Button variant="ghost" size="sm" onClick={() => setDrawer("suivi")}>Suivi</Button></>}
        </div>
        <p className="ml-auto hidden text-xs text-muted-foreground lg:block">Démonstration · données fictives</p>
      </header>
      <div className="dashboard-grid min-h-0 flex-1">
        <div className="hidden min-h-0 lg:block">{profile}</div>
        <div className="scene-column relative flex min-h-0 min-w-0 flex-col">
          <div className="scene-heading grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 py-2">
            <p className="min-w-0 font-display text-xl text-foreground">Potentiel et épanouissement</p>
            {selected && <Button variant="outline" size="sm" onClick={back} aria-label="Revenir à l'arbre complet" className="hidden lg:inline-flex"><ArrowLeft /> Arbre complet</Button>}
          </div>
          <div className="tree-frame relative min-h-0 flex-1">
            <LifeTree focusId={focus} selectedNode={node} onFocus={open} onNode={setNode} onBack={back} hidden={hidden} fragilityId={frag} onFragility={openFrag} onFactor={setFactorId} selectedFactor={factorId} avatar={avatar} />
          </div>
        </div>
        <div className="details-column hidden min-h-0 lg:block">{details ?? <aside className="glass-panel flex h-full flex-col gap-6 overflow-y-auto p-5">
          <p className="eyebrow">Accompagnement · Léo, 8 ans</p><h2 className="font-display text-3xl">Ressources et découvertes</h2>
          <div className="border-y border-border py-5"><Heart className="mb-3 text-gold" /><h3 className="font-display text-2xl">Identifier ses émotions</h3><p className="mt-2 text-sm text-muted-foreground">Repères observés, ressources présentes et pistes d’accompagnement.</p><Button variant="outline" className="mt-4 w-full" onClick={() => open("emotionnel")}>Explorer Émotionnel</Button></div>
          <div><ShieldCheck className="mb-3 text-primary" /><h3 className="font-display text-2xl">Contextes et protection</h3><Button variant="outline" className="mt-4 w-full" onClick={() => openFrag("f-anxiete")}>Examiner l’anxiété</Button></div>
        </aside>}</div>
        <div className="followup-column hidden min-h-0 lg:block"><FollowUpZone onDomain={open} onFragility={openFrag} /></div>
      </div>
      {selected && <div className="mobile-details fixed inset-x-3 bottom-3 z-30 lg:hidden">{details}</div>}
      {drawer && <div className="fixed inset-0 z-50 bg-background/80 p-3 backdrop-blur-sm" onClick={() => setDrawer(null)}>
        <div className={drawer === "profil" ? "relative h-full w-[90%] max-w-xs" : "absolute inset-x-3 bottom-3 h-[65%]"} onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" className="absolute right-3 top-3 z-10" onClick={() => setDrawer(null)}>Fermer</Button>
          {drawer === "profil" ? profile : <FollowUpZone onDomain={open} onFragility={openFrag} />}
        </div>
      </div>}
      {avatarEditor && <AvatarCustomizer options={avatar} onChange={setAvatar} onClose={() => setAvatarEditor(false)} />}
    </main>
  );
}
