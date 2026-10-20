export function Logo() {
  return (
    <div className="flex items-center gap-3" data-testid="app-logo">
      <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden>
        <defs><linearGradient id="lg-logo" x1="0" y1="1" x2="0" y2="0"><stop stopColor="#f59e0b" /><stop offset="1" stopColor="#fde68a" /></linearGradient></defs>
        <path d="M20 34 C12 28 6 22 8 12 C14 14 18 19 20 26 C22 19 26 14 32 12 C34 22 28 28 20 34Z" fill="url(#lg-logo)" opacity=".9" />
        <path d="M20 30 C17 22 17 13 20 5 C23 13 23 22 20 30Z" fill="#fde68a" />
        <path d="M20 34 V38 M14 37 H26" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div className="leading-tight">
        <p className="font-display text-xl font-semibold">Enfance<span className="text-gold">+</span></p>
        <p className="text-[11px] text-muted-foreground">Comprendre · Agir · Grandir</p>
      </div>
    </div>
  );
}
