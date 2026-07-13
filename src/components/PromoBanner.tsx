import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles, ArrowLeft } from "lucide-react";
import { TileStar } from "@/components/PersianPattern";

type PromoBanner = {
  enabled: boolean;
  version: number;
  delayMs: number;
  title: string;
  subtitle: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  accent: "gold" | "turquoise" | "navy";
};

const DISMISS_KEY = "promo:dismissed:v";

export default function PromoBanner() {
  const [cfg, setCfg] = useState<PromoBanner | null>(null);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Never show inside admin
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    let cancelled = false;
    fetch("/api/settings/promo-banner")
      .then(r => (r.ok ? r.json() : null))
      .then((c: PromoBanner | null) => { if (!cancelled) setCfg(c); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

  useEffect(() => {
    if (!cfg || !cfg.enabled || isAdmin) return;
    const dismissedFor = Number(localStorage.getItem(DISMISS_KEY) || "0");
    if (dismissedFor >= cfg.version) return;
    const t = setTimeout(() => setOpen(true), Math.max(0, cfg.delayMs ?? 3000));
    return () => clearTimeout(t);
  }, [cfg, isAdmin]);

  function dismiss() {
    if (cfg) localStorage.setItem(DISMISS_KEY, String(cfg.version));
    setOpen(false);
  }

  if (!cfg) return null;

  const accentRing =
    cfg.accent === "turquoise" ? "ring-turquoise/50" :
    cfg.accent === "navy" ? "ring-primary/50" : "ring-gold/60";
  const accentBtn =
    cfg.accent === "turquoise" ? "bg-turquoise text-white hover:bg-turquoise/90" :
    cfg.accent === "navy" ? "bg-primary text-primary-foreground hover:bg-primary/90" :
    "bg-gold text-gold-foreground hover:bg-gold/90";
  const accentChip =
    cfg.accent === "turquoise" ? "bg-turquoise/15 text-turquoise" :
    cfg.accent === "navy" ? "bg-primary/10 text-primary" :
    "bg-gold/15 text-gold";

  const external = /^https?:\/\//i.test(cfg.ctaHref);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-primary/60 backdrop-blur-sm"
          onClick={dismiss}
          role="dialog" aria-modal="true" aria-labelledby="promo-title"
        >
          <motion.div
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-3xl overflow-hidden rounded-[2rem] bg-parchment shadow-navy ring-4 ${accentRing}`}
          >
            <button
              onClick={dismiss}
              aria-label="بستن"
              className="absolute top-3 left-3 z-20 h-9 w-9 rounded-full bg-primary/90 text-primary-foreground hover:bg-primary grid place-items-center shadow-lg"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid sm:grid-cols-5">
              {/* Image side */}
              <div className="relative sm:col-span-2 h-40 sm:h-auto overflow-hidden bg-primary">
                <div className="absolute inset-0 tile-bg-navy opacity-60" />
                <TileStar className="absolute -bottom-6 -right-6 w-40 text-gold/30" />
                {cfg.imageUrl ? (
                  <img
                    src={cfg.imageUrl}
                    alt=""
                    className="relative w-full h-full object-cover warm-photo mix-blend-luminosity opacity-90"
                  />
                ) : (
                  <div className="relative h-full w-full grid place-items-center">
                    <Sparkles className="h-16 w-16 text-gold" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-l from-parchment/90 via-parchment/10 to-transparent sm:bg-gradient-to-l" />
              </div>

              {/* Content side */}
              <div className="sm:col-span-3 p-6 sm:p-9 relative">
                {cfg.badge && (
                  <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold mb-4 ${accentChip}`}>
                    <Sparkles className="h-3 w-3" /> {cfg.badge}
                  </div>
                )}
                <h2 id="promo-title" className="text-2xl sm:text-3xl font-black text-primary leading-tight mb-3">
                  {cfg.title}
                </h2>
                <p className="text-sm sm:text-base text-primary/75 leading-8 mb-6">
                  {cfg.subtitle}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  {external ? (
                    <a
                      href={cfg.ctaHref} onClick={dismiss}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-gold transition-colors ${accentBtn}`}
                    >
                      {cfg.ctaLabel} <ArrowLeft className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      to={cfg.ctaHref} onClick={dismiss}
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-bold shadow-gold transition-colors ${accentBtn}`}
                    >
                      {cfg.ctaLabel} <ArrowLeft className="h-4 w-4" />
                    </Link>
                  )}
                  <button onClick={dismiss} className="text-sm text-primary/60 hover:text-primary font-bold">
                    بعداً
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
