import { useState } from "react";
import { X, Minus, Plus, Sprout } from "lucide-react";
import { KIND_LABEL, type Domain } from "@/data/domains";
import { useApp } from "@/context/AppContext";
import { DOMAIN_ICON, domainColor } from "@/lib/icons";
import { DetailsTab, ActionsTab, ImpactsTab, ResourcesTab } from "./DomainTabs";

const TABS = [["details", "Détails"], ["actions", "Actions"], ["impacts", "Impacts"], ["ressources", "Ressources"]] as const;
type Tab = (typeof TABS)[number][0];

export function LevelBar({ domainId, compact = false }: { domainId: string; compact?: boolean }) {
  const { child, setLevel } = useApp();
  const level = child?.levels[domainId] ?? 1;
  return (
    <div className="flex items-center gap-2" data-testid={`level-bar-${domainId}`}>
      {!compact && <button className="icon-btn h-7 w-7" disabled={level <= 1} onClick={() => setLevel(domainId, level - 1)} aria-label="Baisser le niveau" data-testid={`level-dec-${domainId}`}><Minus size={13} /></button>}
      <div className="level-track flex-1"><div className="level-fill" style={{ width: `${level * 20}%` }} /></div>
      {!compact && <button className="icon-btn h-7 w-7" disabled={level >= 5} onClick={() => setLevel(domainId, level + 1)} aria-label="Augmenter le niveau" data-testid={`level-inc-${domainId}`}><Plus size={13} /></button>}
      <span className="w-8 text-right text-sm font-semibold" data-testid={`level-value-${domainId}`}>{level}/5</span>
    </div>
  );
}

export function DetailPanel({ domain, nodeId }: { domain: Domain; nodeId: string | null }) {
  const { back } = useApp();
  const [tab, setTab] = useState<Tab>("details");
  const node = domain.nodes.find((n) => n.id === nodeId);
  const Icon = DOMAIN_ICON[domain.id] ?? Sprout;
  return (
    <aside className="panel panel-enter flex h-full flex-col overflow-hidden" data-testid="domain-detail-panel">
      <header className="flex items-start gap-3 p-4 pb-3">
        <span className="medal-lg" style={{ ["--c" as string]: domainColor(domain.id) }}><Icon size={24} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium" style={{ color: domainColor(domain.id) }}>{domain.name}</p>
          <h2 className="font-display text-2xl font-semibold leading-tight" data-testid="detail-title">{node?.label ?? domain.name}</h2>
        </div>
        <button className="icon-btn h-8 w-8" onClick={back} aria-label="Fermer" data-testid="detail-close-button"><X size={16} /></button>
      </header>
      <div className="space-y-2 px-4">
        <p className="text-xs text-muted-foreground">Niveau actuel</p>
        <LevelBar domainId={domain.id} />
        <p className="pt-1 text-sm text-foreground/85">{node ? <><span className="tag mr-1">{KIND_LABEL[node.kind]}</span>{node.note}</> : domain.intro}</p>
      </div>
      <div className="tabbar mx-4 mt-3" role="tablist">
        {TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`tabbar-btn ${tab === id ? "tabbar-on" : ""}`} data-testid={`detail-tab-${id}`}>{label}</button>)}
      </div>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4">
        {tab === "details" && <DetailsTab domain={domain} />}
        {tab === "actions" && <ActionsTab domain={domain} />}
        {tab === "impacts" && <ImpactsTab domain={domain} />}
        {tab === "ressources" && <ResourcesTab domain={domain} />}
      </div>
    </aside>
  );
}
