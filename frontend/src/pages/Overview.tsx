import { ReminderBanner } from "@/components/layout/Reminders";
import { useEffect, useState } from "react";
import { Eye, Clock4, GitCompare, Minus, Plus } from "lucide-react";
import { useApp, type Mode } from "@/context/AppContext";
import { DOMAINS } from "@/data/domains";
import { FRAGILITIES } from "@/data/fragilities";
import { FACTORS } from "@/data/factors";
import { LifeTree } from "@/components/tree/LifeTree";
import { DetailPanel } from "@/components/tree/DetailPanel";
import { FragilityPanel } from "@/components/tree/FragilityPanel";
import { FactorPanel } from "@/components/tree/FactorPanel";
import { OverviewPanel } from "@/components/tree/OverviewPanel";
import { SimulationZone } from "@/components/sim/SimulationZone";
import { FuturePreview } from "@/components/sim/FuturePreview";
import { ModeOverlay } from "@/components/sim/ModeOverlay";
import { HORIZONS, doneSteps, projectedLevels } from "@/lib/rpg";
import { PAINTED_TREE } from "@/lib/assets";
import { usePortraitSrc } from "@/components/layout/Portrait";
import { TreeArtButton } from "@/components/tree/TreeArtButton";
import { ProgressionChart } from "@/components/sim/ProgressionChart";

const MODES: [Mode, string, typeof Eye][] = [["actuelle", "Vue actuelle", Eye], ["simulation", "Simulation", Clock4], ["comparaison", "Comparaison", GitCompare]];

export default function Overview({ fullTree = false }: { fullTree?: boolean }) {
  const app = useApp();
  const { child, focus, node, frag, factorId, hidden, mode, setMode, scenario, horizon, back, openDomain, openNode, openFrag, setFactorId } = app;
  const [detail, setDetail] = useState(() => (window.innerWidth < 768 ? 1 : 2));
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") back(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [back]);
  const treeImg = usePortraitSrc(child?.tree_image);
  if (!child) return null;

  const domain = DOMAINS.find((d) => d.id === focus);
  const fragility = FRAGILITIES.find((f) => f.id === frag);
  const factor = FACTORS.find((f) => f.id === factorId);
  const proj = projectedLevels(child.levels, scenario, HORIZONS[horizon]?.t ?? 5, doneSteps(child));
  const levelLabels = Object.fromEntries(DOMAINS.map((d) => {
    const now = child.levels[d.id] ?? 1;
    if (mode === "simulation") return [d.id, `→ ${proj[d.id]?.toFixed(1)}/5`];
    if (mode === "comparaison") return [d.id, `${child.initial_levels[d.id] ?? now} → ${now}`];
    return [d.id, `Niv. ${now}/5`];
  }));
  const treeSrc = treeImg ?? PAINTED_TREE;
  const onNode = (nid: string) => { const d = DOMAINS.find((x) => x.nodes.some((n) => n.id === nid)); if (d) openNode(d.id, nid); };

  const panel = factor ? <FactorPanel factor={factor} onNetwork={() => setFactorId(null)} onBack={back} />
    : domain ? <DetailPanel key={domain.id} domain={domain} nodeId={node} />
    : fragility ? <FragilityPanel key={fragility.id} f={fragility} onBack={back} onDomain={openDomain} onFactor={setFactorId} />
    : <OverviewPanel />;

  return (
    <>
    <ReminderBanner />
    <div className={`overview-grid ${fullTree ? "overview-full" : ""}`} data-testid="overview-page">
      <section className="panel scene relative flex min-h-0 flex-col overflow-hidden" data-testid="tree-scene">
        <div className="z-10 flex flex-wrap items-center gap-2 p-3">
          <div className="seg">
            {MODES.map(([m, label, Icon]) => (
              <button key={m} onClick={() => setMode(m)} className={`seg-btn ${mode === m ? "seg-on" : ""}`} data-testid={`mode-${m}`}><Icon size={14} />{label}</button>
            ))}
          </div>
          <h2 className="mx-auto hidden font-display text-xl font-semibold md:block">Son potentiel grandit chaque jour <span className="block text-center text-xs font-normal text-muted-foreground">7 domaines pour l'aider à s'épanouir</span></h2>
          <TreeArtButton />
          <div className="seg items-center gap-2 px-3 text-xs" data-testid="detail-level-control">
            <span className="text-muted-foreground">Niveau de détail</span>
            <button className="icon-btn h-6 w-6" onClick={() => setDetail(1)} aria-label="Moins de détails" data-testid="detail-minus"><Minus size={12} /></button>
            <button className="icon-btn h-6 w-6" onClick={() => setDetail(2)} aria-label="Plus de détails" data-testid="detail-plus"><Plus size={12} /></button>
          </div>
        </div>
        <div className="tree-frame relative min-h-0 flex-1" style={{ ["--painted" as string]: `url(${treeSrc})` }}>
          <LifeTree avatar={child.avatar} focusId={focus} selectedNode={node} onFocus={openDomain} onNode={onNode} onBack={back} hidden={hidden}
            fragilityId={frag} onFragility={openFrag} onFactor={setFactorId} selectedFactor={factorId} levelLabels={levelLabels} showAllNodes={detail === 2} paintedSrc={treeSrc} />
          {(focus || frag) && <button onClick={back} className="btn-back absolute bottom-4 left-4" data-testid="tree-back-button">← Arbre complet</button>}
          {mode !== "actuelle" && <ModeOverlay />}
        </div>
      </section>
      <div className="overview-right min-h-0" data-testid="detail-column">{panel}</div>
      {!fullTree && <div className="bottom-split grid min-h-0 gap-3 md:grid-cols-2"><SimulationZone /><ProgressionChart /></div>}
      {!fullTree && <FuturePreview />}
    </div>
    </>
  );
}
