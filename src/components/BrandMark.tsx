// Brand mark for آموزشگاه گویا — a simple "G" monogram. Vector, no assets, RTL-safe.
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
        <rect x="2" y="2" width="60" height="60" rx="16" fill="hsl(var(--primary))" />
        <text
          x="32" y="45"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="36"
          fontWeight="700"
          fill="hsl(var(--gold))"
        >
          G
        </text>
      </svg>


      {showWordmark && (
        <div className="hidden sm:flex flex-col leading-none">
          <span className="text-xl font-black text-primary tracking-tight">
            گویا
          </span>
          <span className="text-[10px] font-bold text-primary/60 tracking-tight mt-1">
            آموزشگاه زبان
          </span>
        </div>
      )}
    </div>
  );
}
