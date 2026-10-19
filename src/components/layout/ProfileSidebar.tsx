import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { AvatarIllustration, type AvatarOptions } from "./AvatarIllustration";
import { DOMAINS } from "@/data/domains";

export const CHILD = { name: "Léo", age: "8 ans", level: "CE2", note: "Profil fictif de démonstration" };

export function ProfileSidebar({ hidden, onToggle, onOpen, avatar, onAvatar }: {
  avatar: AvatarOptions; onAvatar: () => void; hidden: string[]; onToggle: (id: string) => void; onOpen: (id: string) => void;
}) {
  return (
    <aside className="glass-panel flex h-full flex-col gap-5 overflow-y-auto p-5">
      <div className="profile-portrait"><AvatarIllustration options={avatar} className="h-full w-full" /></div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none">{CHILD.name}</p>
          <p className="text-xs text-muted-foreground">{CHILD.age} · {CHILD.level}</p>
        </div>
        <Button variant="outline" size="icon" onClick={onAvatar} aria-label="Personnaliser l’avatar" title="Personnaliser l’avatar"><Pencil /></Button>
      </div>
      <p className="tag">{CHILD.note}</p>

      <section className="space-y-2">
        <h3 className="eyebrow">Domaines</h3>
        <ul className="space-y-1">
          {DOMAINS.map((d) => {
            const on = !hidden.includes(d.id);
            const c = `oklch(0.82 0.14 ${d.hue})`;
            return (
              <li key={d.id} className="flex items-center gap-2">
                <button onClick={() => onOpen(d.id)} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-muted/40">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c, boxShadow: `0 0 8px ${c}` }} />
                  <span className="truncate">{d.name}</span>
                </button>
                <button role="switch" aria-checked={on} aria-label={`Afficher ${d.name}`} onClick={() => onToggle(d.id)}
                  className="switch shrink-0" data-on={on} style={{ ["--sw" as string]: c }} />
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2 text-xs text-muted-foreground">
        <h3 className="eyebrow">Légende</h3>
        <p className="flex items-center gap-2"><span className="legend-diamond" /> Défi ou fragilité (évolutive)</p>
        <p className="flex items-center gap-2"><span className="h-px w-5 border-t border-dashed border-gold" /> Relation possible, non causale</p>
      </section>
    </aside>
  );
}
