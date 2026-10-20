import { useEffect } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarIllustration, type AvatarOptions } from "./AvatarIllustration";

export function AvatarCustomizer({ options, onChange, onClose }: { options: AvatarOptions; onChange: (value: AvatarOptions) => void; onClose: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const groups = [
    { key: "face", label: "Visage", names: ["Ovale", "Allongé", "Arrondi"] },
    { key: "hair", label: "Coiffure", names: ["Boucles", "Courte", "Longue"] },
    { key: "accessory", label: "Éléments", names: ["Sans accessoire", "Lunettes", "Feuille dorée"] },
  ] as const;
  return <div className="fixed inset-0 z-[80] grid place-items-center bg-background/80 p-4 backdrop-blur-md" onClick={onClose} data-testid="avatar-modal">
    <section role="dialog" aria-modal="true" aria-labelledby="avatar-title" className="avatar-dialog w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 id="avatar-title" className="min-w-0 font-display text-3xl">Avatar de démonstration</h2><Button variant="ghost" size="icon" aria-label="Fermer la personnalisation" onClick={onClose} data-testid="avatar-close-button"><X /></Button></header>
      <AvatarIllustration options={options} className="mx-auto h-40 w-36" />
      <div className="space-y-4">{groups.map((g) => <fieldset key={g.key}><legend className="mb-2 text-sm text-muted-foreground">{g.label}</legend><div className="grid grid-cols-3 gap-2">{g.names.map((name, i) => <Button key={name} size="sm" variant="outline" aria-pressed={options[g.key] === i} className="avatar-choice h-auto min-h-10 whitespace-normal" data-testid={`avatar-${g.key}-${i}`} onClick={() => onChange({ ...options, [g.key]: i })}>{name}</Button>)}</div></fieldset>)}</div>
      <Button className="mt-5 w-full" onClick={onClose} data-testid="avatar-validate-button"><Check /> Valider l’avatar</Button>
    </section>
  </div>;
}