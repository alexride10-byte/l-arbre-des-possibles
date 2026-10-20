export interface AvatarOptions { face: number; hair: number; accessory: number }
export const DEFAULT_AVATAR: AvatarOptions = { face: 0, hair: 0, accessory: 0 };

/** Entirely illustrated fictional portrait; no photo or remote service. */
export function AvatarIllustration({ options, className = "" }: { options: AvatarOptions; className?: string }) {
  return <svg viewBox="0 0 160 180" className={`avatar-illustration ${className}`} role="img" aria-label="Avatar illustré fictif">
    <defs><linearGradient id={`coat-${options.face}-${options.hair}-${options.accessory}`} x2="1" y2="1"><stop stopColor="var(--avatar-coat)" /><stop offset="1" stopColor="var(--bark-dark)" /></linearGradient></defs>
    <path d="M8 180 Q12 135 52 130 L108 130 Q149 138 153 180" fill={`url(#coat-${options.face}-${options.hair}-${options.accessory})`} />
    <path d="M64 116 L63 138 Q80 153 97 138 L96 113" fill="var(--avatar-skin-shadow)" />
    <ellipse cx="43" cy="84" rx="9" ry="15" fill="var(--avatar-skin)" /><ellipse cx="117" cy="84" rx="9" ry="15" fill="var(--avatar-skin)" />
    <path d={options.face === 1 ? "M43 58 Q80 25 117 58 L114 101 Q108 133 80 137 Q51 133 46 102Z" : options.face === 2 ? "M43 60 Q80 27 117 60 L117 100 Q111 130 80 130 Q48 130 43 100Z" : "M44 60 Q80 28 116 60 L112 102 Q104 130 80 132 Q53 128 47 102Z"} fill="var(--avatar-skin)" />
    <path d="M54 77 Q63 71 70 77 M90 77 Q99 71 107 77" fill="none" stroke="var(--avatar-hair)" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="63" cy="86" rx="3" ry="4" fill="var(--avatar-ink)" /><ellipse cx="98" cy="86" rx="3" ry="4" fill="var(--avatar-ink)" />
    <path d="M81 88 L77 100 L84 101 M69 113 Q81 121 94 111" fill="none" stroke="var(--avatar-skin-shadow)" strokeWidth="2" strokeLinecap="round" />
    {options.hair === 0 ? <path d="M39 83 Q18 40 46 28 Q59 8 80 19 Q114 7 128 38 Q141 65 119 87 L111 61 Q96 65 92 41 Q78 69 51 64Z" fill="var(--avatar-hair)" /> : options.hair === 1 ? <path d="M36 86 Q30 15 81 17 Q130 15 125 84 L115 71 L107 44 Q85 58 49 49 L45 86Z" fill="var(--avatar-hair)" /> : <path d="M35 141 Q20 49 45 28 Q82 5 116 31 Q140 55 126 141 L112 127 L110 63 Q83 57 77 36 Q62 62 49 65 L48 132Z" fill="var(--avatar-hair)" />}
    <path d="M48 42 Q65 24 86 30 M98 34 Q112 39 116 54" fill="none" stroke="var(--avatar-hair-light)" strokeWidth="3" strokeLinecap="round" />
    <path d="M62 138 L80 157 L99 138 M80 157 V180" fill="none" stroke="var(--gold)" strokeWidth="2" opacity=".7" />
    {options.accessory === 1 && <g fill="none" stroke="var(--avatar-ink)" strokeWidth="2"><rect x="50" y="79" width="26" height="20" rx="7" /><rect x="86" y="79" width="26" height="20" rx="7" /><path d="M76 85 Q81 82 86 85" /></g>}
    {options.accessory === 2 && <g fill="var(--gold)"><path d="M115 45 Q133 30 127 51 Q120 58 115 45Z" /><circle cx="80" cy="161" r="5" /></g>}
  </svg>;
}