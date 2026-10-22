import { useMemo } from "react";
import { rng } from "./geometry";

const COLORS = ["#ffe08a", "#7fe3ff", "#d2b0ff", "#a8f7c0", "#ff9a8a", "#99f6e4"];

export function Atmosphere({ particles }: { particles: boolean }) {
  const flies = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const r = rng(i * 7 + 3);
    return { l: r() * 100, t: 18 + r() * 76, d: 7 + r() * 9, delay: -r() * 12, s: 1.5 + r() * 2.5, c: COLORS[i % COLORS.length] };
  }), []);
  return (
    <div className="atmo" aria-hidden>
      <div className="atmo-stars" />
      <div className="atmo-rays" />
      <div className="atmo-halo" />
      {particles && flies.map((f, i) => (
        <span key={i} className="firefly" style={{ left: `${f.l}%`, top: `${f.t}%`, width: f.s, height: f.s, background: f.c, boxShadow: `0 0 ${f.s * 5}px ${f.c}`, animationDuration: `${f.d}s`, animationDelay: `${f.delay}s` }} />
      ))}
      <div className="atmo-mist" />
      <div className="atmo-vignette" />
    </div>
  );
}
