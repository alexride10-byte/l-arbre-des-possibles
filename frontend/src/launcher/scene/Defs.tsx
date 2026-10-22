import { DOMAINS_L } from "../data/launcher";

export function Defs() {
  return (
    <defs>
      <path id="leaf" d="M0 -12 C7 -6 7 6 0 12 C-7 6 -7 -6 0 -12Z" />
      <linearGradient id="bark" x1="0" x2="1" y1="0" y2="0.3">
        <stop offset="0" stopColor="#140f26" /><stop offset=".42" stopColor="#3f3156" /><stop offset=".62" stopColor="#6d5674" /><stop offset="1" stopColor="#191331" />
      </linearGradient>
      <linearGradient id="trunkBark" x1="0" x2="1">
        <stop offset="0" stopColor="#120d22" /><stop offset=".3" stopColor="#35284a" /><stop offset=".52" stopColor="#7b6070" /><stop offset=".7" stopColor="#3b2d4f" /><stop offset="1" stopColor="#100b1e" />
      </linearGradient>
      <linearGradient id="coreGlow" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ffe3a0" stopOpacity=".95" /><stop offset=".6" stopColor="#f5b942" stopOpacity=".55" /><stop offset="1" stopColor="#f5b942" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="rootGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3a2c4c" /><stop offset="1" stopColor="#1a1430" stopOpacity=".6" />
      </linearGradient>
      <linearGradient id="soil" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a0d22" stopOpacity="0" /><stop offset=".25" stopColor="#070917" stopOpacity=".75" /><stop offset="1" stopColor="#04050e" stopOpacity=".95" />
      </linearGradient>
      <radialGradient id="rootLight"><stop offset="0" stopColor="#ffd98a" stopOpacity=".7" /><stop offset=".4" stopColor="#f5b942" stopOpacity=".22" /><stop offset="1" stopColor="#f5b942" stopOpacity="0" /></radialGradient>
      <radialGradient id="groundGlow"><stop offset="0" stopColor="#7d8cff" stopOpacity=".28" /><stop offset="1" stopColor="#7d8cff" stopOpacity="0" /></radialGradient>
      <radialGradient id="capGlow"><stop offset="0" stopColor="#ffe9a8" stopOpacity=".95" /><stop offset=".35" stopColor="#f5c542" stopOpacity=".45" /><stop offset="1" stopColor="#f5c542" stopOpacity="0" /></radialGradient>
      <radialGradient id="fragGlow"><stop offset="0" stopColor="#ffc2cc" stopOpacity=".9" /><stop offset=".35" stopColor="#f07a96" stopOpacity=".4" /><stop offset="1" stopColor="#f07a96" stopOpacity="0" /></radialGradient>
      {DOMAINS_L.map((d) => (
        <radialGradient key={d.id} id={`glow-${d.id}`}>
          <stop offset="0" stopColor={d.palette.light} stopOpacity=".55" /><stop offset=".45" stopColor={d.palette.main} stopOpacity=".2" /><stop offset="1" stopColor={d.palette.main} stopOpacity="0" />
        </radialGradient>
      ))}
      <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
      <clipPath id="avatarClip"><circle r="27" /></clipPath>
    </defs>
  );
}
