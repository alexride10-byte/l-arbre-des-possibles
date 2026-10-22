import { useEffect, useState } from "react";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { DOMAINS, KIND_LABEL, type Domain, type NodeKind, type SubNode } from "@/data/domains";
import { FRAGILITIES, type Fragility } from "@/data/fragilities";
import { api, send } from "@/lib/api";
import { applyContent, clone, defaultOf, type ContentDoc, type ContentKind } from "@/lib/content";
import { frDate } from "@/lib/icons";

type Item = Domain | Fragility;

function TextField({ label, value, onChange, area, testid }: { label: string; value: string; onChange: (v: string) => void; area?: boolean; testid: string }) {
  return (
    <label className="block text-xs text-muted-foreground">{label}
      {area ? <textarea rows={3} className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} />
        : <input className="field mt-1" value={value} onChange={(e) => onChange(e.target.value)} data-testid={testid} />}
    </label>
  );
}

function ListField({ label, value, onChange, testid }: { label: string; value: string[]; onChange: (v: string[]) => void; testid: string }) {
  return (
    <label className="block text-xs text-muted-foreground">{label} <span className="opacity-70">(une ligne par élément)</span>
      <textarea rows={3} className="field mt-1" value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} data-testid={testid} />
    </label>
  );
}

function NodesField({ nodes, onChange }: { nodes: SubNode[]; onChange: (n: SubNode[]) => void }) {
  const set = (i: number, p: Partial<SubNode>) => onChange(nodes.map((n, k) => (k === i ? { ...n, ...p } : n)));
  return (
    <div className="space-y-2" data-testid="content-nodes">
      <p className="text-xs text-muted-foreground">Sous-branches</p>
      {nodes.map((n, i) => (
        <div key={n.id} className="grid gap-2 rounded-xl border border-border p-2 md:grid-cols-[1fr_170px_2fr_auto]">
          <input className="field" value={n.label} onChange={(e) => set(i, { label: e.target.value })} placeholder="Nom" data-testid={`content-node-label-${i}`} />
          <select className="field" value={n.kind} onChange={(e) => set(i, { kind: e.target.value as NodeKind })} data-testid={`content-node-kind-${i}`}>
            {Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <input className="field" value={n.note} onChange={(e) => set(i, { note: e.target.value })} placeholder="Description" data-testid={`content-node-note-${i}`} />
          <button className="icon-btn" onClick={() => onChange(nodes.filter((_, k) => k !== i))} aria-label="Retirer" data-testid={`content-node-remove-${i}`}><Trash2 size={14} /></button>
        </div>
      ))}
      <button className="btn-outline h-9" onClick={() => onChange([...nodes, { id: `n_${Date.now()}`, label: "Nouvelle sous-branche", kind: "competence", note: "" }])} data-testid="content-node-add"><Plus size={14} /> Ajouter une sous-branche</button>
    </div>
  );
}

function DomainForm({ d, set }: { d: Domain; set: (p: Partial<Domain>) => void }) {
  return (
    <>
      <TextField label="Nom du domaine" value={d.name} onChange={(v) => set({ name: v })} testid="content-name" />
      <TextField label="Présentation" value={d.intro} onChange={(v) => set({ intro: v })} area testid="content-intro" />
      <NodesField nodes={d.nodes} onChange={(nodes) => set({ nodes })} />
      <div className="grid gap-3 md:grid-cols-2">
        <ListField label="Points forts" value={d.strengths} onChange={(v) => set({ strengths: v })} testid="content-strengths" />
        <ListField label="Fragilités" value={d.fragilities} onChange={(v) => set({ fragilities: v })} testid="content-fragilities" />
        <ListField label="Pistes d'accompagnement" value={d.pistes} onChange={(v) => set({ pistes: v })} testid="content-pistes" />
        <ListField label="Ressources" value={d.resources} onChange={(v) => set({ resources: v })} testid="content-resources" />
      </div>
    </>
  );
}

function FragilityForm({ f, set }: { f: Fragility; set: (p: Partial<Fragility>) => void }) {
  return (
    <>
      <TextField label="Nom" value={f.label} onChange={(v) => set({ label: v })} testid="content-name" />
      <TextField label="Présentation" value={f.intro} onChange={(v) => set({ intro: v })} area testid="content-intro" />
      <div className="grid gap-3 md:grid-cols-2">
        <ListField label="Questions à explorer" value={f.hypotheses} onChange={(v) => set({ hypotheses: v })} testid="content-hypotheses" />
        <ListField label="Pistes d'intervention" value={f.interventions} onChange={(v) => set({ interventions: v })} testid="content-interventions" />
      </div>
    </>
  );
}

const tidy = (it: Item) => {
  const out = clone(it) as unknown as Record<string, unknown>;
  for (const k of Object.keys(out)) if (Array.isArray(out[k]) && typeof (out[k] as unknown[])[0] !== "object") out[k] = (out[k] as string[]).map((s) => s.trim()).filter(Boolean);
  return out;
};

export function ContentEditor() {
  const [kind, setKind] = useState<ContentKind>("domain");
  const [id, setId] = useState(DOMAINS[0].id);
  const [docs, setDocs] = useState<ContentDoc[]>([]);
  const [draft, setDraft] = useState<Item>(clone(DOMAINS[0]));
  const [msg, setMsg] = useState("");
  const items: Item[] = kind === "domain" ? DOMAINS : FRAGILITIES;
  const load = () => api<ContentDoc[]>("/content").then(setDocs);
  useEffect(() => { load(); }, []);
  useEffect(() => { setDraft(clone(items.find((i) => i.id === id) ?? items[0])); setMsg(""); }, [kind, id]);
  const doc = docs.find((d) => d.kind === kind && d.item_id === id);
  const set = (p: Partial<Item>) => setDraft({ ...draft, ...p } as Item);
  const pickKind = (k: ContentKind) => { setKind(k); setId((k === "domain" ? DOMAINS : FRAGILITIES)[0].id); };
  const save = async () => {
    const data = tidy(draft);
    await send(`/admin/content/${kind}/${id}`, "PUT", { data });
    applyContent(kind, id, data); await load(); setMsg("Enregistré ✓ — visible par toute l'équipe");
  };
  const reset = async () => {
    if (!window.confirm("Revenir au texte d'origine ?")) return;
    await send(`/admin/content/${kind}/${id}`, "DELETE");
    applyContent(kind, id, null); setDraft(defaultOf(kind, id) as unknown as Item); await load(); setMsg("Texte d'origine rétabli");
  };
  return (
    <div className="space-y-4" data-testid="admin-content">
      <div className="flex flex-wrap items-center gap-2">
        {([["domain", "Domaines de l'arbre"], ["fragility", "Défis et fragilités"]] as const).map(([k, l]) => (
          <button key={k} className={`chip ${kind === k ? "chip-active" : ""}`} onClick={() => pickKind(k)} data-testid={`content-kind-${k}`}>{l}</button>
        ))}
        <select className="field ml-auto h-10 w-64" value={id} onChange={(e) => setId(e.target.value)} data-testid="content-item-select">
          {items.map((i) => <option key={i.id} value={i.id}>{"name" in i ? i.name : i.label}</option>)}
        </select>
      </div>
      {doc && <p className="text-xs text-amber-200" data-testid="content-modified-note">Modifié le {frDate(doc.updated_at!)} par {doc.updated_by}</p>}
      {kind === "domain" ? <DomainForm d={draft as Domain} set={set} /> : <FragilityForm f={draft as Fragility} set={set} />}
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-primary" onClick={save} data-testid="content-save-button"><Save size={15} /> Enregistrer</button>
        {doc && <button className="btn-outline" onClick={reset} data-testid="content-reset-button"><RotateCcw size={14} /> Texte d'origine</button>}
        {msg && <span className="text-xs text-emerald-300" data-testid="content-message">{msg}</span>}
      </div>
    </div>
  );
}
