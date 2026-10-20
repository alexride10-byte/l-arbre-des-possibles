import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") && p.endsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>));
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="md space-y-1.5 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} className="h-1" />;
        if (/^#{1,4}\s/.test(t)) return <p key={i} className="pt-1 font-display text-base font-semibold text-gold">{inline(t.replace(/^#+\s/, ""))}</p>;
        if (/^[-*•]\s/.test(t)) return <p key={i} className="flex gap-2 pl-1"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" /><span>{inline(t.slice(2))}</span></p>;
        if (/^\d+\.\s/.test(t)) return <p key={i} className="pl-1">{inline(t)}</p>;
        return <p key={i}>{inline(t)}</p>;
      })}
    </div>
  );
}
