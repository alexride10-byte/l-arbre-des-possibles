import type { CSSProperties, ReactNode } from "react";
import { X } from "lucide-react";

interface Props { eyebrow: string; title: string; accent?: string; onClose: () => void; children: ReactNode; testid: string; side?: "right" | "left" }

export function Sheet({ eyebrow, title, accent = "#f5c46a", onClose, children, testid, side = "right" }: Props) {
  return (
    <aside className={`lx-sheet lx-sheet-${side}`} style={{ "--accent": accent } as CSSProperties} data-testid={testid}>
      <div className="lx-sheet-handle" />
      <header className="lx-sheet-head">
        <div>
          <p className="lx-eyebrow">{eyebrow}</p>
          <h2 className="lx-sheet-title" data-testid={`${testid}-title`}>{title}</h2>
        </div>
        <button className="lx-icon" onClick={onClose} aria-label="Fermer" data-testid={`${testid}-close`}><X size={18} /></button>
      </header>
      <div className="lx-sheet-body">{children}</div>
    </aside>
  );
}

export const Section = ({ title, children, testid }: { title: string; children: ReactNode; testid?: string }) => (
  <section className="lx-section" data-testid={testid}>
    <p className="lx-eyebrow">{title}</p>
    {children}
  </section>
);

export const Disclaimer = ({ children }: { children: ReactNode }) => <p className="lx-disclaimer" data-testid="exploration-disclaimer">{children}</p>;
