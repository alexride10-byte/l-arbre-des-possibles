import type { Domain } from "@/data/domains";

export const VIEW = { w: 1000, h: 800 };
export const TRUNK_TOP = { x: 500, y: 440 };
export const GROUND_Y = 640;

export interface P { x: number; y: number }
export interface Bez { p0: P; c1: P; c2: P; p3: P }
export interface Leaf { x: number; y: number; r: number; rot: number; tone: number }

export interface BranchGeo {
  end: P;
  /** Forme pleine effilée de la branche principale. */
  body: string;
  /** Ligne centrale (sève, zone cliquable). */
  spine: string;
  twigs: string[];
  leaves: Leaf[];
  nodes: P[];
  /** Sous-branches révélées au zoom, vers chaque nœud. */
  reveal: string[];
  label: P;
}

/** Pseudo-aléatoire déterministe (évite les écarts SSR/client). */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const f = (n: number) => n.toFixed(1);

export function bezAt(b: Bez, t: number): P {
  const u = 1 - t;
  const a = u * u * u, c = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return { x: a * b.p0.x + c * b.c1.x + d * b.c2.x + e * b.p3.x, y: a * b.p0.y + c * b.c1.y + d * b.c2.y + e * b.p3.y };
}

function tangent(b: Bez, t: number): P {
  const u = 1 - t;
  const x = 3 * u * u * (b.c1.x - b.p0.x) + 6 * u * t * (b.c2.x - b.c1.x) + 3 * t * t * (b.p3.x - b.c2.x);
  const y = 3 * u * u * (b.c1.y - b.p0.y) + 6 * u * t * (b.c2.y - b.c1.y) + 3 * t * t * (b.p3.y - b.c2.y);
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
}

export const bezD = (b: Bez) =>
  `M${f(b.p0.x)},${f(b.p0.y)} C${f(b.c1.x)},${f(b.c1.y)} ${f(b.c2.x)},${f(b.c2.y)} ${f(b.p3.x)},${f(b.p3.y)}`;

/** Polygone effilé le long d'une courbe de Bézier (largeur w0 → w1). */
export function taper(b: Bez, w0: number, w1: number, n = 26): string {
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bezAt(b, t), d = tangent(b, t);
    const w = (w0 + (w1 - w0) * Math.pow(t, 0.7)) / 2;
    L.push({ x: p.x - d.y * w, y: p.y + d.x * w });
    R.push({ x: p.x + d.y * w, y: p.y - d.x * w });
  }
  const pts = [...L, ...R.reverse()];
  return "M" + pts.map((p) => `${f(p.x)},${f(p.y)}`).join(" L") + " Z";
}

/** Bézier organique d'un point vers une direction, avec courbure. */
function limb(from: P, ang: number, len: number, bend: number): Bez {
  const p3 = { x: from.x + Math.cos(ang) * len, y: from.y + Math.sin(ang) * len };
  const a1 = ang - bend, a2 = ang + bend * 0.6;
  return {
    p0: from,
    c1: { x: from.x + Math.cos(a1) * len * 0.4, y: from.y + Math.sin(a1) * len * 0.4 },
    c2: { x: p3.x - Math.cos(a2) * len * 0.35, y: p3.y - Math.sin(a2) * len * 0.35 },
    p3,
  };
}

function leafCluster(at: P, count: number, spread: number, r: () => number, out: Leaf[]) {
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * spread;
    out.push({ x: at.x + Math.cos(a) * d, y: at.y + Math.sin(a) * d * 0.8, r: 3 + r() * 4.5, rot: r() * 360, tone: r() });
  }
}

/** Ramification récursive : rameaux qui se divisent puis se couvrent de feuilles. */
function grow(from: P, ang: number, len: number, w: number, depth: number, r: () => number, twigs: string[], leaves: Leaf[]) {
  const bend = (r() - 0.5) * 0.7;
  const b = limb(from, ang, len, bend);
  twigs.push(taper(b, w, Math.max(0.6, w * 0.3), 14));
  if (depth === 0) {
    leafCluster(b.p3, 7, 16, r, leaves);
    leafCluster(bezAt(b, 0.6), 3, 10, r, leaves);
    return;
  }
  const spread = 0.35 + r() * 0.35;
  grow(bezAt(b, 0.55), ang - spread, len * 0.62, w * 0.55, depth - 1, r, twigs, leaves);
  grow(b.p3, ang + spread * 0.8, len * 0.58, w * 0.5, depth - 1, r, twigs, leaves);
  if (r() > 0.4) grow(b.p3, ang - spread * 0.3, len * 0.5, w * 0.45, depth - 1, r, twigs, leaves);
}

export function branchGeometry(domains: Domain[]): BranchGeo[] {
  const n = domains.length;
  return domains.map((d, i) => {
    const r = seeded(11 + i * 37);
    const t = i / (n - 1);
    const a = (-168 + 156 * t) * (Math.PI / 180);
    const side = t < 0.5 ? -1 : 1;
    const R = 270 + Math.sin(t * Math.PI) * 10;
    const end = { x: TRUNK_TOP.x + R * Math.cos(a) * 1.15, y: TRUNK_TOP.y + R * Math.sin(a) * 0.95 };
    const p0 = { x: TRUNK_TOP.x + (t - 0.5) * 50, y: TRUNK_TOP.y + 18 };
    const main: Bez = {
      p0,
      c1: { x: p0.x + (end.x - p0.x) * 0.15, y: p0.y - 90 - Math.abs(t - 0.5) * 40 },
      c2: { x: p0.x + (end.x - p0.x) * 0.6, y: end.y + 40 + Math.abs(t - 0.5) * 60 },
      p3: end,
    };
    const tipAng = Math.atan2(end.y - main.c2.y, end.x - main.c2.x);

    const twigs: string[] = [];
    const leaves: Leaf[] = [];
    // Sous-branches latérales qui se divisent
    for (const [tt, off, len] of [[0.42, -0.75, 95], [0.62, 0.55, 80], [0.8, -0.5, 70]] as const) {
      const p = bezAt(main, tt), tg = tangent(main, tt);
      const ang = Math.atan2(tg.y, tg.x) + off * side * (side < 0 ? -1 : 1) + (r() - 0.5) * 0.3;
      grow(p, ang - 0.25, len, 7 - tt * 4, 2, r, twigs, leaves);
    }
    // Couronne au bout de la branche
    grow(end, tipAng - 0.4, 60, 4, 1, r, twigs, leaves);
    grow(end, tipAng + 0.35, 55, 4, 1, r, twigs, leaves);
    leafCluster(end, 14, 34, r, leaves);

    // Nœuds répartis dans le feuillage, côté extérieur
    const nodes = d.nodes.map((_, k) => {
      const ang = tipAng + (k / Math.max(1, d.nodes.length - 1) - 0.5) * 2.8;
      return { x: end.x + Math.cos(ang) * 72, y: end.y + Math.sin(ang) * 62 };
    });
    const reveal = nodes.map((p) => {
      const mx = (end.x + p.x) / 2 + (p.y - end.y) * 0.25, my = (end.y + p.y) / 2 - (p.x - end.x) * 0.25;
      return `M${f(end.x)},${f(end.y)} Q${f(mx)},${f(my)} ${f(p.x)},${f(p.y)}`;
    });

    return {
      end,
      body: taper(main, 26, 5),
      spine: bezD(main),
      twigs,
      leaves,
      nodes,
      reveal,
      label: (() => { const dx = end.x - 500, dy = end.y - 520, l = Math.hypot(dx, dy) || 1; return { x: end.x + (dx / l) * 70, y: end.y + (dy / l) * 78 + 6 }; })(),
    };
  });
}

export interface RootGeo { body: string; spine: string; end: P; label?: string | undefined }

export function rootGeometry(labels: string[]): RootGeo[] {
  const r = seeded(99);
  const out: RootGeo[] = [];
  const total = labels.length * 2 - 1;
  for (let i = 0; i < total; i++) {
    const t = i / (total - 1);
    const labelIdx = i % 2 === 0 && i / 2 < labels.length ? i / 2 : -1;
    const ex = 120 + t * 760 + (r() - 0.5) * 20;
    const ey = labelIdx >= 0 ? 735 + Math.sin(t * Math.PI) * 25 : 690 + r() * 40;
    const p0 = { x: 450 + t * 100, y: GROUND_Y - 6 };
    const b: Bez = {
      p0,
      c1: { x: p0.x + (ex - p0.x) * 0.2, y: GROUND_Y + 40 },
      c2: { x: ex - (ex - 500) * 0.25, y: ey - 50 + r() * 20 },
      p3: { x: ex, y: ey },
    };
    out.push({ body: taper(b, labelIdx >= 0 ? 22 : 14, 1.5), spine: bezD(b), end: b.p3, label: labels[labelIdx] });
  }
  return out;
}

/** Tronc large et évasé, avec veines d'écorce. */
export function trunkGeometry() {
  const b: Bez = { p0: { x: 500, y: GROUND_Y + 6 }, c1: { x: 478, y: 580 }, c2: { x: 520, y: 500 }, p3: { x: 500, y: TRUNK_TOP.y } };
  const body = taper(b, 150, 70, 30);
  const veins = Array.from({ length: 9 }, (_, i) => {
    const o = (i - 4) / 4;
    return `M${f(500 + o * 62)},${f(GROUND_Y)} C${f(478 + o * 45)},580 ${f(520 + o * 32)},505 ${f(500 + o * 26)},${TRUNK_TOP.y + 5}`;
  });
  return { body, veins, spine: bezD(b) };
}
