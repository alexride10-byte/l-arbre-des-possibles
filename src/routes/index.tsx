import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DOMAINS } from "@/data/domains";
import { LifeTree } from "@/components/tree/LifeTree";
import { DomainPanel } from "@/components/tree/DomainPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Enfance+ — L'arbre de vie de l'accompagnement" },
      { name: "description", content: "Explorez les six domaines du développement de l'enfant à travers un arbre de vie interactif, pour les professionnels de l'enfance." },
      { property: "og:title", content: "Enfance+ — L'arbre de vie de l'accompagnement" },
      { property: "og:description", content: "Un outil immersif pour observer, comprendre et accompagner l'enfant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [focus, setFocus] = useState<string | null>(null);
  const [node, setNode] = useState<string | null>(null);
  const domain = DOMAINS.find((d) => d.id === focus);

  const back = () => { setFocus(null); setNode(null); };
  const open = (id: string) => { setFocus(id); setNode(null); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && back();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  return (
    <main className="night-sky relative h-screen w-full overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 md:px-10">
        <h1 className="font-display text-3xl tracking-wide text-foreground">
          Enfance<span className="text-gold">+</span>
        </h1>
        <nav className="hidden gap-6 text-xs uppercase tracking-[0.2em] text-muted-foreground md:flex">
          <button onClick={back} className={!focus ? "text-foreground" : "hover:text-foreground"}>Arbre</button>
          {DOMAINS.map((d) => (
            <button key={d.id} onClick={() => open(d.id)}
              className={focus === d.id ? "text-foreground" : "hover:text-foreground"}>
              {d.name.split(" ")[0]}
            </button>
          ))}
        </nav>
      </header>

      <div className={`absolute inset-0 transition-all duration-700 ${focus ? "md:right-[420px]" : ""}`}>
        <LifeTree focusId={focus} selectedNode={node} onFocus={open} onNode={setNode} onBack={back} />
      </div>

      {!focus && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 text-center">
          <p className="text-sm text-muted-foreground">Choisissez une branche pour explorer un domaine</p>
          <p className="mt-1 text-xs text-muted-foreground/70">Les liens pointillés indiquent des proximités possibles, non des causalités.</p>
        </div>
      )}

      {domain && (
        <div className="absolute inset-x-3 bottom-3 top-[45%] z-30 md:inset-x-auto md:bottom-6 md:right-6 md:top-24 md:w-[400px]">
          <DomainPanel key={domain.id} domain={domain} selectedNode={node} onNode={setNode} onBack={back} />
        </div>
      )}

      <p className="absolute bottom-2 left-4 z-10 hidden text-[10px] text-muted-foreground/60 md:block">
        Version de démonstration · données fictives · aucune donnée enregistrée
      </p>
    </main>
  );
}
