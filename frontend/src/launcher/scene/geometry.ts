import { CAPACITIES, DOMAINS_L, FRAGILITIES_L, ROOTS_L, type LDomain } from "../data/launcher";

export type Pt = { x: number; y: number };
export interface Curve { p0: Pt; c1: Pt; c2: Pt; p1: Pt }
export interface Leaf { x: number; y: number; r: number; s: number; fill: string; o: number; d: number }

const rad = (d: number) => (d * Math.PI) / 180;
const f = (n: number) => n.toFixed(1);

export function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

export const bez = (c: Curve, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * c.p0.x + 3 * u * u * t * c.c1.x + 3 * u * t * t * c.c2.x + t * t * t * c.p1.x,
    y: u * u * u * c.p0.y + 3 * u * u * t * c.c1.y + 3 * u * t * t * c.c2.y + t * t * t * c.p1.y,
  };
};
const deriv = (c: Curve, t: number): Pt => {
  const u = 1 - t;
  return {
    x: 3 * u * u * (c.c1.x - c.p0.x) + 6 * u * t * (c.c2.x - c.c1.x) + 3 * t * t * (c.p1.x - c.c2.x),
    y: 3 * u * u * (c.c1.y - c.p0.y) + 6 * u * t * (c.c2.y - c.c1.y) + 3 * t * t * (c.p1.y - c.c2.y),
  };
};

export const curvePath = (c: Curve) => `M${f(c.p0.x)} ${f(c.p0.y)} C${f(c.c1.x)} ${f(c.c1.y)} ${f(c.c2.x)} ${f(c.c2.y)} ${f(c.p1.x)} ${f(c.p1.y)}`;

export function taper(c: Curve, w0: number, w1: number, n = 30) {
  const L: string[] = [], R: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = bez(c, t), d = deriv(c, t), len = Math.hypot(d.x, d.y) || 1;
    const w = (w1 + (w0 - w1) * Math.pow(1 - t, 1.3)) / 2, nx = -d.y / len, ny = d.x / len;
    L.push(`${f(p.x + nx * w)} ${f(p.y + ny * w)}`);
    R.push(`${f(p.x - nx * w)} ${f(p.y - ny * w)}`);
  }
  return `M${L.join(" L")} L${R.reverse().join(" L")} Z`;
}

export function makeCurve(p0: Pt, p1: Pt, bend: number): Curve {
  const dx = p1.x - p0.x, dy = p1.y - p0.y, len = Math.hypot(dx, dy);
  let px = -dy / len, py = dx / len;
  if (py > 0) { px = -px; py = -py; }
  return {
    p0, p1,
    c1: { x: p0.x + dx * 0.33 + px * bend, y: p0.y + dy * 0.33 + py * bend },
    c2: { x: p0.x + dx * 0.7 + px * bend * 0.5, y: p0.y + dy * 0.7 + py * bend * 0.5 },
  };
}

const polar = (o: Pt, a: number, r: number): Pt => ({ x: o.x + Math.cos(rad(a)) * r, y: o.y - Math.sin(rad(a)) * r });

const LAYOUT: Record<string, { a: number; L: number; o: Pt; bend: number }> = {
  sante: { a: 168, L: 300, o: { x: 488, y: 566 }, bend: 42 },
  cognitif: { a: 143, L: 315, o: { x: 490, y: 540 }, bend: 34 },
  autonomie: { a: 117, L: 320, o: { x: 494, y: 522 }, bend: -26 },
  emotionnel: { a: 90, L: 335, o: { x: 500, y: 510 }, bend: 18 },
  social: { a: 63, L: 320, o: { x: 506, y: 522 }, bend: 26 },
  scolaire: { a: 37, L: 315, o: { x: 510, y: 540 }, bend: -34 },
  environnement: { a: 12, L: 300, o: { x: 512, y: 566 }, bend: -42 },
};

export const CANOPY_R = 94;
const SUB_OFFSETS = [-150, -90, -30, 30, 90, 150];

function leaves(d: LDomain, center: Pt, R: number, count: number, seed: number, scale: number, delay: number): Leaf[] {
  const r = rng(seed), shades = [d.palette.main, d.palette.light, d.palette.deep, d.palette.main];
  return Array.from({ length: count }, (_, i) => {
    const th = r() * Math.PI * 2, rr = R * Math.sqrt(r());
    return {
      x: center.x + Math.cos(th) * rr * 1.08, y: center.y + Math.sin(th) * rr * 0.92,
      r: r() * 360, s: scale * (0.65 + r() * 0.7), fill: shades[Math.floor(r() * shades.length)],
      o: 0.55 + r() * 0.45, d: delay + (rr / R) * 0.9 + r() * 0.35 + i * 0.0006,
    };
  });
}

function buildDomain(d: LDomain, i: number) {
  const g = LAYOUT[d.id], end = polar(g.o, g.a, g.L), curve = makeCurve(g.o, end, g.bend);
  const canopy = polar(end, g.a, 18);
  const offshoots = [0.42, 0.6].map((t, k) => {
    const p = bez(curve, t), a = g.a + (k ? -38 : 34);
    return makeCurve(p, polar(p, a, 78 - k * 12), k ? -12 : 12);
  });
  const twigs = d.subs.map((s, k) => {
    const start = bez(curve, 0.7 + k * 0.05), tip = polar(canopy, g.a + SUB_OFFSETS[k], 88);
    return { sub: s, curve: makeCurve(start, tip, k % 2 ? 10 : -10), tip, angle: g.a + SUB_OFFSETS[k] };
  });
  const decoLeaves = offshoots.flatMap((o, k) => leaves(d, o.p1, 30, 18, 900 + i * 13 + k, 0.8, 2.3 + i * 0.08));
  return {
    d, curve, end, canopy, angle: g.a, offshoots, twigs,
    label: polar(canopy, 90 + (g.a - 90) * 0.55, CANOPY_R + 28),
    leaves: [...leaves(d, canopy, CANOPY_R, 120, 17 + i * 101, 1, 2.2 + i * 0.08), ...decoLeaves],
    detail: twigs.flatMap((t, k) => leaves(d, t.tip, 22, 16, 500 + i * 31 + k, 0.55, 0.5 + k * 0.08)),
  };
}

const ROOT_TIPS: Pt[] = [{ x: 215, y: 898 }, { x: 345, y: 934 }, { x: 500, y: 952 }, { x: 655, y: 934 }, { x: 785, y: 898 }];

export const TRUNK = "M438 808 C462 792 472 742 476 680 C480 612 483 560 485 506 L515 506 C517 560 520 612 524 680 C528 742 538 792 562 808 Z";
export const TRUNK_CORE = "M500 806 C497 740 498 640 500 512";
export const GROUND_Y = 806;

const nodeCol = (x: number, flip: boolean) => (k: number): Pt => ({ x: flip ? 1000 - (x + (k % 2) * 22) : x + (k % 2) * 22, y: 576 + k * 34 });

export const TREE = {
  domains: DOMAINS_L.map(buildDomain),
  roots: ROOTS_L.map((r, k) => {
    const o = { x: 470 + k * 15, y: 800 }, tip = ROOT_TIPS[k];
    return { r, tip, curve: makeCurve(o, tip, k === 2 ? 8 : 26 * (k < 2 ? -1 : 1)) };
  }),
  capacities: CAPACITIES.map((n, k) => ({ n, p: nodeCol(392, false)(k) })),
  fragilities: FRAGILITIES_L.map((n, k) => ({ n, p: nodeCol(392, true)(k) })),
};

export type TreeDomain = (typeof TREE.domains)[number];

export function anchorOf(id: string): Pt | null {
  const d = TREE.domains.find((x) => x.d.id === id);
  if (d) return d.canopy;
  const r = TREE.roots.find((x) => x.r.id === id);
  if (r) return r.tip;
  const n = [...TREE.capacities, ...TREE.fragilities].find((x) => x.n.id === id);
  return n ? n.p : null;
}

export const linkPath = (a: Pt, b: Pt) => {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, k = 0.22;
  return `M${f(a.x)} ${f(a.y)} Q${f(mx + (500 - mx) * k)} ${f(my - Math.abs(a.x - b.x) * k)} ${f(b.x)} ${f(b.y)}`;
};
