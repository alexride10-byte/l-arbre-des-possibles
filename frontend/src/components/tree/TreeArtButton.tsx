import { useState } from "react";
import { Wand2, RotateCcw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { send, type Child } from "@/lib/api";

export function TreeArtButton() {
  const { child, saveChild, canWrite } = useApp();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!child || !canWrite) return null;
  const run = async (method: "POST" | "DELETE") => {
    setBusy(true); setErr("");
    try { saveChild(await send<Child>(`/children/${child.child_id}/tree${method === "POST" ? "/generate" : ""}`, method)); }
    catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="relative flex items-center gap-1" data-testid="tree-art-controls">
      <button className="btn-ai h-8 px-3 text-xs" disabled={busy} onClick={() => run("POST")} title={child.avatar.portrait ? "Peindre l'arbre avec l'avatar de l'enfant" : "Choisissez d'abord un avatar manga"} data-testid="tree-generate-button">
        <Wand2 size={13} /> {busy ? "Peinture en cours (≈15 s)…" : child.tree_image ? "Repeindre son arbre" : `Peindre l'arbre ${/^[aeiouyàâéèêëîïôûüh]/i.test(child.name) ? "d'" : "de "}${child.name}`}
      </button>
      {child.tree_image && !busy && <button className="icon-btn h-8 w-8" onClick={() => run("DELETE")} aria-label="Revenir à l'arbre de base" title="Revenir à l'arbre de base" data-testid="tree-reset-button"><RotateCcw size={13} /></button>}
      {err && <p className="popover absolute right-0 top-10 z-30 w-64 p-2 text-xs text-red-300" data-testid="tree-generate-error">{err}</p>}
    </div>
  );
}
