import type { Pt } from "./geometry";

export type View = "home" | "overview" | "panel" | "domain";
export type Rect = { x: number; y: number; w: number; h: number };
export interface Camera { x: number; y: number; s: number }

const WORLD: Rect = { x: 40, y: 14, w: 920, h: 980 };

export const isWide = (W: number) => W >= 1024;

function screenRect(view: View, W: number, H: number): Rect {
  const wide = isWide(W);
  if (view === "home") return wide ? { x: W * 0.36, y: 16, w: W * 0.62, h: H - 32 } : { x: 0, y: 150, w: W, h: H - 150 - 235 };
  if (view === "overview") return { x: 0, y: 70, w: W, h: H - 70 - (wide ? 92 : 110) };
  return wide ? { x: 0, y: 70, w: W - 470, h: H - 90 } : { x: 0, y: 58, w: W, h: H * 0.48 - 58 };
}

export function cameraFor(view: View, W: number, H: number, focus?: Pt): Camera {
  const world = view === "domain" && focus ? { x: focus.x - 190, y: focus.y - 180, w: 380, h: 360 } : isWide(W) ? WORLD : { ...WORLD, x: 0, w: 1000 };
  const scr = screenRect(view, W, H);
  const s = Math.min(scr.w / world.w, scr.h / world.h);
  return { s, x: scr.x + (scr.w - world.w * s) / 2 - world.x * s, y: scr.y + (scr.h - world.h * s) / 2 - world.y * s };
}
