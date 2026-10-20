import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { api, send, streamAssistant, type AiMessage } from "@/lib/api";
import { DOMAINS } from "@/data/domains";
import { Markdown } from "./Markdown";

export function AssistantDrawer() {
  const { assistant, closeAssistant, child, focus } = useApp();
  const [msgs, setMsgs] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const domain = DOMAINS.find((d) => d.id === focus);

  useEffect(() => {
    if (!assistant.open || !child) return;
    api<AiMessage[]>(`/children/${child.child_id}/assistant`).then((h) => {
      setMsgs(h);
      if (assistant.prompt) ask(assistant.prompt);
    });
  }, [assistant.open, assistant.nonce, child?.child_id]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const ask = async (text: string) => {
    if (!child || !text.trim() || busy) return;
    setInput(""); setError(""); setBusy(true);
    setMsgs((m) => [...m, { role: "user", text }, { role: "assistant", text: "" }]);
    try {
      await streamAssistant(child.child_id, text, (d) => setMsgs((m) => [...m.slice(0, -1), { role: "assistant", text: (m[m.length - 1]?.text ?? "") + d }]));
    } catch (e) {
      setError((e as Error).message); setMsgs((m) => m.slice(0, -1));
    } finally { setBusy(false); }
  };


  if (!assistant.open || !child) return null;
  const quick = [
    `Fais une synthèse des observations de ${child.name}, en distinguant faits, hypothèses et pistes.`,
    domain ? `Propose 3 pistes d'intervention pour le domaine « ${domain.name} » de ${child.name}.` : `Quelles sont les 3 priorités d'accompagnement pour ${child.name} ?`,
    `Aide-moi à préparer un échange bienveillant avec la famille de ${child.name}.`,
  ];
  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-background/50 backdrop-blur-[2px]" onClick={closeAssistant} data-testid="assistant-overlay">
      <aside className="drawer flex h-full w-full max-w-[460px] flex-col" onClick={(e) => e.stopPropagation()} data-testid="assistant-drawer">
        <header className="flex items-center gap-3 border-b border-border p-4">
          <span className="medal-sm"><Sparkles size={16} /></span>
          <div className="flex-1"><p className="font-display text-lg font-semibold">Assistant Enfance+</p><p className="text-[11px] text-muted-foreground">Accompagnement de {child.name} · aucune donnée de diagnostic</p></div>
          <button className="icon-btn h-8 w-8" onClick={async () => { await send(`/children/${child.child_id}/assistant`, "DELETE"); setMsgs([]); }} aria-label="Effacer" data-testid="assistant-clear-button"><Trash2 size={15} /></button>
          <button className="icon-btn h-8 w-8" onClick={closeAssistant} aria-label="Fermer" data-testid="assistant-close-button"><X size={16} /></button>
        </header>
        <div className="flex-1 space-y-4 overflow-y-auto p-4" data-testid="assistant-messages">
          {msgs.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Je peux proposer des pistes d'intervention, rédiger des synthèses ou préparer un échange. Suggestions :</p>
              {quick.map((q, i) => <button key={q} onClick={() => ask(q)} className="quick-prompt" data-testid={`assistant-quick-${i}`}>{q}</button>)}
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={m.role === "user" ? "bubble-user" : "bubble-ai"} data-testid={`assistant-msg-${m.role}`}>
              {m.role === "user" ? <p className="text-sm">{m.text}</p> : m.text ? <Markdown text={m.text} /> : <span className="typing"><i /><i /><i /></span>}
            </div>
          ))}
          {error && <p className="text-xs text-red-300" data-testid="assistant-error">{error}</p>}
          <div ref={endRef} />
        </div>
        <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2 border-t border-border p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question…" className="field h-11" disabled={busy} data-testid="assistant-input" />
          <button type="submit" className="btn-primary h-11 w-12 shrink-0 px-0" disabled={busy} aria-label="Envoyer" data-testid="assistant-send-button"><Send size={16} className="mx-auto" /></button>
        </form>
      </aside>
    </div>
  );
}
