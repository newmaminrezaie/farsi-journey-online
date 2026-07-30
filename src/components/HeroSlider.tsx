import { useEffect, useState } from "react";
import { localImages } from "@/assets/local";

type Slide = { imageUrl: string; alt: string };

// Defaults used until the admin sets their own images.
const DEFAULT_SLIDES: Slide[] = [
  { imageUrl: localImages.heroClass, alt: "کلاس زبان انگلیسی آموزشگاه گویا" },
  { imageUrl: localImages.classKids, alt: "کلاس زبان کودکان" },
  { imageUrl: localImages.classReading, alt: "تمرین مکالمه و روخوانی در کلاس" },
];

export default function HeroSlider() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [intervalMs, setIntervalMs] = useState(6000);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch("/api/settings/hero")
      .then(r => (r.ok ? r.json() : null))
      .then((cfg: { intervalMs?: number; slides?: Slide[] } | null) => {
        if (!cfg) return;
        const usable = (cfg.slides || []).filter(s => s.imageUrl?.trim());
        if (usable.length) setSlides(usable);
        if (cfg.intervalMs) setIntervalMs(cfg.intervalMs);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(t);
  }, [slides.length, intervalMs]);

  return (
    <div className="warm-photo-overlay warm-photo rounded-3xl relative">
      <div className="relative w-full h-[420px] overflow-hidden">
        {slides.map((s, i) => (
          <img
            key={`${s.imageUrl}-${i}`}
            src={s.imageUrl}
            alt={s.alt || "کلاس زبان"}
            loading={i === 0 ? "eager" : "lazy"}
            className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-out"
            style={{
              opacity: i === idx ? 1 : 0,
              transform: i === idx ? "translateX(0)" : "translateX(-4%)",
            }}
          />
        ))}
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 start-4 z-10 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              aria-label={`تصویر ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-gold" : "w-2 bg-parchment/70 hover:bg-parchment"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
