// Decorative Persian tile SVG blocks — inline, no external calls.

export function TileStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        <polygon points="50,4 61,39 96,39 68,61 79,96 50,74 21,96 32,61 4,39 39,39" />
        <polygon points="50,20 57,42 80,42 62,55 68,77 50,64 32,77 38,55 20,42 43,42" />
        <circle cx="50" cy="50" r="8" />
      </g>
    </svg>
  );
}

export function TileHex({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <polygon points="50,2 92,26 92,74 50,98 8,74 8,26" />
        <polygon points="50,18 78,34 78,66 50,82 22,66 22,34" />
        <polygon points="50,34 64,42 64,58 50,66 36,58 36,42" />
      </g>
    </svg>
  );
}
