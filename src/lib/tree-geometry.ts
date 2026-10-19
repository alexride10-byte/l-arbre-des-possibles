import type { Domain } from "@/data/domains";

export const VIEW = { w: 1000, h: 800 };
export const TRUNK_TOP = { x: 500, y: 430 };
export const GROUND_Y = 640;

export interface BranchGeo {
  end: { x: number; y: number };
  path: string;
  nodes: { x: number; y: number }[];
}

export function branchGeometry(domains: Domain[]): BranchGeo[] {
  const n = domains.length;
  return domains.map((d, i) => {
    const a = (-165 + (150 / (n - 1)) * i) * (Math.PI / 180);
    const R = i === 0 || i === n - 1 ? 330 : 300;
    const end = { x: TRUNK_TOP.x + R * Math.cos(a), y: TRUNK_TOP.y + R * Math.sin(a) * 0.95 };
    const sx = TRUNK_TOP.x + (end.x - TRUNK_TOP.x) * 0.05;
    const sy = TRUNK_TOP.y + 20;
    const c1 = { x: TRUNK_TOP.x + (end.x - TRUNK_TOP.x) * 0.2, y: TRUNK_TOP.y - 60 };
    const c2 = { x: TRUNK_TOP.x + (end.x - TRUNK_TOP.x) * 0.7, y: end.y + 50 };
    const path = `M${sx},${sy} C${c1.x},${c1.y} ${c2.x},${c2.y} ${end.x},${end.y}`;
    const nodes = d.nodes.map((_, k) => {
      const t = (k / d.nodes.length) * Math.PI * 2 - Math.PI / 2;
      return { x: end.x + Math.cos(t) * 48, y: end.y + Math.sin(t) * 48 };
    });
    return { end, path, nodes };
  });
}

/** Pseudo-aléatoire déterministe (évite les écarts SSR/client). */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
