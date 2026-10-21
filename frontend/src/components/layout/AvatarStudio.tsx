import { useState } from "react";
import { Sparkles, Wand2, Check } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { send, type Child } from "@/lib/api";
import { PORTRAITS } from "@/lib/assets";
import { Portrait, portraitSrc } from "@/components/layout/Portrait";
import { xpLevel } from "@/lib/rpg";

const OPTS = {
  gender: ["garçon", "fille", "neutre"],
  hair: ["cheveux bruns bouclés", "cheveux longs noirs", "carré court noir", "cheveux roux ondulés", "cheveux blonds en bataille", "tresses africaines", "foulard coloré"],
  outfit: ["veste beige", "sweat à capuche turquoise", "ciré jaune", "pull violet", "tenue d'aventurier", "maillot de sport rouge"],
  accessory: ["aucun", "lunettes rondes", "casquette", "écharpe", "petit sac à dos", "casque audio"],
  background: ["ciel doré au coucher du soleil", "nuit étoilée magique", "forêt enchantée avec lucioles", "ville fantasy lumineuse", "prairie fleurie au printemps"],
  expression: ["sourire confiant", "regard curieux", "joie éclatante", "calme et serein", "air déterminé"],
} as const;
const LABEL: Record<string, string> = { gender: "Personnage", hair: "Coiffure", outfit: "Tenue", accessory: "Accessoire", background: "Arrière-plan", expression: "Expression" };

export function AvatarStudio() {
  const { child, saveChild, canWrite } = useApp();
  const [tab, setTab] = useState<"lib" | "ai" | "evo">("lib");
  const [o, setO] = useState<Record<string, string>>({ gender: "neutre", hair: OPTS.hair[0], outfit: OPTS.outfit[0], accessory: "aucun", background: OPTS.background[0], expression: OPTS.expression[0] });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!child) return null;
  const pick = async (url: string) => saveChild(await send<Child>(`/children/${child.child_id}`, "PUT", { avatar: { ...child.avatar, portrait: url } }));
  const gen = async () => {
    setBusy(true); setErr("");
    try { saveChild(await send<Child>(`/children/${child.child_id}/avatar/generate`, "POST", o)); setTab("evo"); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const history = child.avatar_history ?? [];
  return (
    <section className="panel space-y-4 p-5" data-testid="avatar-studio">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto font-display text-xl font-semibold">Personnalisation de l'avatar</h2>
        <div className="seg">{([["lib", "Galerie"], ["ai", "Créer avec l'IA"], ["evo", "Évolution"]] as const).map(([t, l]) => <button key={t} className={`seg-btn ${tab === t ? "seg-on" : ""}`} onClick={() => setTab(t)} data-testid={`avatar-tab-${t}`}>{l}</button>)}</div>
      </div>
      {tab === "lib" && (
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8">
          {PORTRAITS.map((p) => (
            <button key={p.id} disabled={!canWrite} onClick={() => pick(p.url)} className={`avatar-tile ${child.avatar.portrait === p.url ? "avatar-tile-on" : ""}`} title={p.label} data-testid={`avatar-pick-${p.id}`}>
              <img src={p.url} alt={p.label} loading="lazy" />{child.avatar.portrait === p.url && <Check size={14} className="absolute right-1 top-1 rounded-full bg-amber-400 p-0.5 text-black" />}
            </button>
          ))}
        </div>
      )}
      {tab === "ai" && (
        <div className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            {Object.entries(OPTS).map(([k, vals]) => (
              <label key={k} className="text-xs text-muted-foreground">{LABEL[k]}
                <select className="field mt-1" value={o[k]} onChange={(e) => setO({ ...o, [k]: e.target.value })} data-testid={`avatar-opt-${k}`}>{vals.map((v) => <option key={v}>{v}</option>)}</select>
              </label>
            ))}
          </div>
          <button className="btn-gold-solid" onClick={gen} disabled={busy || !canWrite} data-testid="avatar-generate-button"><Wand2 size={15} /> {busy ? "Création du portrait (≈15 s)…" : "Générer mon avatar"}</button>
          {err && <p className="text-xs text-red-300" data-testid="avatar-generate-error">{err}</p>}
          <p className="text-[11px] text-muted-foreground"><Sparkles size={11} className="inline" /> Portrait manga unique créé par IA à partir de ces choix. Aucune photo réelle de l'enfant n'est utilisée.</p>
        </div>
      )}
      {tab === "evo" && (
        <div className="space-y-2" data-testid="avatar-evolution">
          <p className="text-sm text-muted-foreground">Mon avatar évolue : il se transforme et se débloque au fil des progrès (niveau actuel {xpLevel(child.xp).level}).</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[...history.map((h) => ({ url: h.url, lvl: xpLevel(h.xp).level })), ...(history.length ? [] : [{ url: child.avatar.portrait ?? "", lvl: xpLevel(child.xp).level }])].map((h, i) => (
              <button key={i} onClick={() => h.url && pick(h.url)} className={`avatar-tile w-28 shrink-0 ${child.avatar.portrait === h.url ? "avatar-tile-on" : ""}`} data-testid={`avatar-history-${i}`}>
                {portraitSrc(h.url) ? <img src={portraitSrc(h.url)!} alt="" /> : <Portrait avatar={child.avatar} />}<span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px]">Niveau {h.lvl}</span>
              </button>
            ))}
            {[1, 2].map((k) => <div key={k} className="avatar-tile grid w-28 shrink-0 place-items-center border-dashed text-[10px] text-muted-foreground">Niveau {xpLevel(child.xp).level + k}<br />à débloquer</div>)}
          </div>
        </div>
      )}
    </section>
  );
}
