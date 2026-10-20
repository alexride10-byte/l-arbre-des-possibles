import { useState } from "react";
import { FileText, Printer, Download, Sparkles } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { streamAssistant } from "@/lib/api";
import { Markdown } from "@/components/assistant/Markdown";
import { DOMAINS } from "@/data/domains";

const KINDS = [
  ["synthese", "Synthèse globale", "Rédige une synthèse structurée du suivi de {n} : points forts, fragilités contextuelles, faits observés, hypothèses, pistes d'accompagnement et indicateurs. Format document."],
  ["famille", "Note pour la famille", "Rédige une note bienveillante et accessible destinée à la famille de {n}, valorisant les progrès et proposant 3 repères à la maison."],
  ["equipe", "Compte rendu d'équipe", "Rédige un compte rendu de réunion d'équipe éducative pour {n} : situation, observations, décisions proposées, prochaines étapes."],
] as const;

export default function DocumentsPage() {
  const { child } = useApp();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!child) return null;
  const run = async (prompt: string) => {
    setText(""); setError(""); setBusy(true);
    try { await streamAssistant(child.child_id, prompt.replace("{n}", child.name), (d) => setText((t) => t + d), false); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  };
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    a.download = `enfance-plus-${child.name.toLowerCase()}.md`; a.click();
  };
  return (
    <div className="page grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]" data-testid="documents-page">
      <section className="panel space-y-3 p-5">
        <h1 className="font-display text-2xl font-semibold">Documents</h1>
        <p className="text-xs text-muted-foreground">Générés par l'assistant IA à partir des niveaux et observations de {child.name}. À relire avant tout partage.</p>
        {KINDS.map(([id, label, prompt]) => (
          <button key={id} className="piste-row" disabled={busy} onClick={() => run(prompt)} data-testid={`doc-generate-${id}`}>
            <span className="medal-xs"><FileText size={12} /></span><span className="flex-1 text-left text-sm">{label}</span><Sparkles size={14} className="text-gold" />
          </button>
        ))}
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">Niveaux actuels : {DOMAINS.map((d) => `${d.name.split(" ")[0]} ${child.levels[d.id]}/5`).join(" · ")}</div>
      </section>
      <section className="panel print-area flex min-h-[60vh] flex-col p-6" data-testid="document-output">
        <div className="mb-4 flex items-center gap-2 print:hidden">
          <p className="mr-auto font-semibold">Aperçu</p>
          <button className="btn-outline" disabled={!text || busy} onClick={() => window.print()} data-testid="doc-print-button"><Printer size={15} /> Imprimer / PDF</button>
          <button className="btn-outline" disabled={!text || busy} onClick={download} data-testid="doc-download-button"><Download size={15} /> Télécharger</button>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {text ? <Markdown text={text} /> : <p className="m-auto text-sm text-muted-foreground">{busy ? "Rédaction en cours…" : "Choisissez un document à générer."}</p>}
      </section>
    </div>
  );
}
