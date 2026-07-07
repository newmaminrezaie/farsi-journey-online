// Custom brand mark for آموزشگاه گویا — an eight-point Persian star
// enclosing a stylized "گ". Fully vector, no external assets, RTL-safe.
type Props = { className?: string; showWordmark?: boolean };

export default function BrandMark({ className = "", showWordmark = true }: Props) {
  return (
    <div className={`flex items-center gap-3 ${className}`} dir="rtl">
      <svg
        viewBox="0 0 64 64"
        className="h-12 w-12 shrink-0"
        aria-label="نشان گویا"
        role="img"
      >
        {/* Outer 8-point star (two overlapping squares) — saffron */}
        <g transform="translate(32 32)">
          <rect
            x="-26" y="-26" width="52" height="52" rx="4"
            fill="hsl(var(--primary))"
          />
          <rect
            x="-26" y="-26" width="52" height="52" rx="4"
            fill="hsl(var(--gold))"
            transform="rotate(45)"
          />
          {/* Inner medallion */}
          <circle r="19" fill="hsl(var(--parchment))" />
          <circle r="19" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.25" />
          {/* Tiny orbiting dots — 8 cardinal points */}
          {Array.from({ length: 8 }).map((_, i) => (
            <circle
              key={i}
              r="1.4"
              cx={Math.cos((i * Math.PI) / 4) * 22}
              cy={Math.sin((i * Math.PI) / 4) * 22}
              fill="hsl(var(--primary))"
            />
          ))}
        </g>
        {/* Persian glyph "گ" — bold, centered */}
        <text
          x="32" y="43"
          textAnchor="middle"
          fontFamily="Vazirmatn, Estedad, system-ui, sans-serif"
          fontSize="30"
          fontWeight="900"
          fill="hsl(var(--primary))"
        >
          گ
        </text>
      </svg>

      {showWordmark && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-xl font-black text-primary tracking-tight">
            گویا
          </span>
          <span className="text-[10px] font-bold text-primary/60 tracking-[0.25em] mt-1">
            آموزشگاه زبان
          </span>
        </div>
      )}
    </div>
  );
}
