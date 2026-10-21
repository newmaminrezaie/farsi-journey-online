import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Phone, ArrowUpRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cartApi } from "@/lib/api";

type NavItem = { label: string; to: string } | { label: string; href: string };

const pages: { to: string; label: string }[] = [
  { to: "/", label: "خانه" },
  { to: "/semesters", label: "کلاس‌ها" },
  { to: "/assessment", label: "تعیین سطح" },
  { to: "/teachers", label: "اساتید و کارکنان" },
  { to: "/shop", label: "فروشگاه کتاب" },
  { to: "/about", label: "درباره" },
  { to: "/contact", label: "تماس" },
];

const externals: { href: string; label: string }[] = [
  { href: "https://portal.higooya.ir", label: "ورود زبان آموز" },
  { href: "https://level.higooya.ir", label: "تعیین سطح با هوش مصنوعی" },
];

const allItems: NavItem[] = [...pages, ...externals];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const loc = useLocation();

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const update = () => setCount(cartApi.read().reduce((s, i) => s + i.qty, 0));
    update();
    window.addEventListener("storage", update);
    const t = setInterval(update, 800);
    return () => { window.removeEventListener("storage", update); clearInterval(t); };
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* ——— ردیف یک: نشان و تماس ——— */}
      <div className="bg-parchment/90 backdrop-blur-md border-b border-primary/10">
        <div className="container flex items-center justify-between h-16 gap-4">
          <Link to="/" className="shrink-0" aria-label="آموزشگاه گویا">
            <BrandMark />
          </Link>

          <div className="flex items-center gap-2">
            <a href="tel:+985157223772" dir="ltr" className="hidden lg:inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors">
              <Phone className="h-4 w-4" /> 051-57223772
            </a>
            <Link to="/cart" aria-label="سبد خرید" className="relative p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-soft transition-colors">
              <ShoppingBag className="h-4 w-4" />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {count.toLocaleString("fa-IR")}
                </span>
              )}
            </Link>
            <button className="lg:hidden p-2.5 rounded-full border border-primary/20" onClick={() => setOpen(o => !o)} aria-label="منو">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* ——— ردیف دو: نوار ناوبری ——— */}
      <div className="hidden lg:block bg-primary border-b border-gold/30">
        <nav aria-label="ناوبری اصلی" className="container flex items-stretch justify-between h-12">
          <ul className="flex items-stretch">
            {pages.map(p => (
              <li key={p.to} className="flex">
                <NavLink to={p.to} end={p.to === "/"}
                  className={({ isActive }) =>
                    `inline-flex items-center px-2.5 xl:px-4 text-[13px] xl:text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                      isActive ? "text-gold border-gold" : "text-parchment/75 hover:text-gold border-transparent"
                    }`
                  }>
                  {p.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ul className="flex items-stretch">
            {externals.map(e => (
              <li key={e.href} className="flex">
                <a href={e.href} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 xl:px-4 text-[13px] xl:text-sm font-bold text-gold border-b-2 border-transparent hover:bg-gold/10 transition-colors whitespace-nowrap">
                  {e.label}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {open && (
        <div className="lg:hidden border-t border-primary/10 bg-parchment">
          <nav className="container py-4 grid gap-1">
            {allItems.map(n =>
              "href" in n ? (
                <a key={n.href} href={n.href} target="_blank" rel="noreferrer"
                  className="flex items-center justify-between px-4 py-3 rounded-lg font-bold text-primary">
                  <span>{n.label}</span>
                  <ArrowUpRight className="h-4 w-4 opacity-60" />
                </a>
              ) : (
                <NavLink key={n.to} to={n.to} end={n.to === "/"}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg font-bold ${isActive ? "bg-primary text-primary-foreground" : "text-primary"}`
                  }>
                  {n.label}
                </NavLink>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
