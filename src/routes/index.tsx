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

const NAV = ["Vue d'ensemble", "Arbre de développement", "Chronologie", "Parcours", "Ressources"];

function Index() {
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
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") { back(); setDrawer(null); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <main className="night-sky flex h-screen w-full flex-col overflow-hidden">
      <header className="z-20 flex h-14 shrink-0 items-center gap-4 border-b border-border/50 px-4 md:px-6">
        <h1 className="font-display text-3xl tracking-wide text-foreground">Enfance<span className="text-gold">+</span></h1>
        <nav className="ml-6 hidden gap-5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:flex">
          {NAV.map((n, i) => (
            <button key={n} onClick={i === 1 ? back : i === 2 || i === 3 ? () => setDrawer(null) : undefined}
              className={i === 1 ? "text-foreground" : "cursor-default opacity-60"} title={i === 1 || i === 2 || i === 3 ? undefined : "Bientôt disponible"}>{n}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 md:hidden">
          {selected ? (
            <Button variant="ghost" onClick={back} aria-label="Revenir à l'arbre complet" className="btn-back">← Arbre complet</Button>
          ) : (
            <>
              <button className="btn-ghost" onClick={() => setDrawer(drawer === "profil" ? null : "profil")}>Profil</button>
              <button className="btn-ghost" onClick={() => setDrawer(drawer === "suivi" ? null : "suivi")}>Suivi</button>
            </>
          )}
        </div>
        <p className="ml-auto hidden text-[10px] text-muted-foreground/70 md:block">Démonstration · données fictives</p>
      </header>

      <div className="flex min-h-0 flex-1 gap-3 p-3">
        <div className="hidden w-52 shrink-0 lg:block">
          <ProfileSidebar hidden={hidden} onToggle={toggle} onOpen={open} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className={`tree-frame relative min-h-0 flex-1 transition-all duration-700 ${selected ? "max-md:flex-[0_0_44%]" : ""}`}>
            {!selected && (
              <p className="pointer-events-none absolute inset-x-0 top-1 z-10 text-center text-xs text-muted-foreground">
                Choisissez une branche ou un losange de fragilité
              </p>
            )}
            {selected && (
              <Button variant="ghost" onClick={back} aria-label="Revenir à l'arbre complet" className="btn-back absolute left-2 top-2 z-20 hidden md:block">← Arbre complet</Button>
            )}
            <LifeTree focusId={focus} selectedNode={node} onFocus={open} onNode={setNode} onBack={back}
              hidden={hidden} fragilityId={frag} onFragility={openFrag} onFactor={setFactorId} selectedFactor={factorId} />
          </div>
          <div className="hidden h-44 shrink-0 md:block"><FollowUpZone onDomain={open} /></div>
          {selected && (
            <div className="min-h-0 flex-1 md:hidden">
              {domain && <DomainPanel key={domain.id} domain={domain} selectedNode={node} onNode={setNode} onBack={back} />}
              {factor ? <FactorPanel factor={factor} onNetwork={() => setFactorId(null)} onBack={back} /> : fragility && <FragilityPanel key={fragility.id} f={fragility} onBack={back} onDomain={open} onFactor={setFactorId} />}
            </div>
          )}
        </div>

        {selected && (
          <div className="hidden w-[340px] lg:w-[380px] shrink-0 md:block">
            {domain && <DomainPanel key={domain.id} domain={domain} selectedNode={node} onNode={setNode} onBack={back} />}
            {factor ? <FactorPanel factor={factor} onNetwork={() => setFactorId(null)} onBack={back} /> : fragility && <FragilityPanel key={fragility.id} f={fragility} onBack={back} onDomain={open} onFactor={setFactorId} />}
          </div>
        )}
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setDrawer(null)}>
          <div className={drawer === "profil" ? "absolute inset-y-3 left-3 w-[80%] max-w-xs" : "absolute inset-x-3 bottom-3 h-[55%]"} onClick={(e) => e.stopPropagation()}>
            {drawer === "profil" ? <ProfileSidebar hidden={hidden} onToggle={toggle} onOpen={open} /> : <FollowUpZone onDomain={open} />}
          </div>
        </div>
      )}
    </main>
  );
}
