import { Heart, Users, Brain, BookOpen, Activity, Sprout, House, type LucideIcon } from "lucide-react";

export const DOMAIN_ICON: Record<string, LucideIcon> = {
  emotionnel: Heart, social: Users, cognitif: Brain, scolaire: BookOpen, sante: Activity, autonomie: Sprout, environnement: House,
};

export const domainColor = (id: string) => `var(--domain-${id})`;

export const frDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export const isoFromFr = (fr: string) => fr.split("/").reverse().join("-");
