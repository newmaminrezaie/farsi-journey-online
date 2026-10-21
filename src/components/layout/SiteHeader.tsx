import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Phone } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cartApi } from "@/lib/api";

type NavItem = { label: string; to: string } | { label: string; href: string };

const nav: NavItem[] = [
  { to: "/", label: "خانه" },
  { to: "/semesters", label: "کلاس‌ها" },
  { to: "/assessment", label: "تعیین سطح" },
  { href: "https://level.higooya.ir", label: "تعیین سطح با هوش مصنوعی" },
  { href: "https://portal.higooya.ir", label: "ورود زبان آموز" },
  { to: "/teachers", label: "اساتید و کارکنان" },
  { to: "/shop", label: "فروشگاه کتاب" },
  { to: "/about", label: "درباره" },
  { to: "/contact", label: "تماس" },
];

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
    <header className="sticky top-0 z-40 bg-parchment/85 backdrop-blur-md border-b border-primary/10">
      <div className="container flex items-center justify-between h-20 gap-6">
        <Link to="/" className="shrink-0" aria-label="آموزشگاه گویا">
          <BrandMark />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map(n =>
            "href" in n ? (
              <a key={n.href} href={n.href} target="_blank" rel="noreferrer"
                title="تعیین سطح زبان انگلیسی با هوش مصنوعی"
                className="px-3 xl:px-4 py-2 rounded-full text-[13px] xl:text-sm font-bold text-primary hover:bg-gold/15 transition-colors whitespace-nowrap">
                {n.label}
              </a>
            ) : (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-3 xl:px-4 py-2 rounded-full text-[13px] xl:text-sm font-bold transition-colors whitespace-nowrap ${
                    isActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-gold/15"
                  }`
                }>
                {n.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <a href="tel:+985157223772" dir="ltr" className="hidden xl:inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors">
            <Phone className="h-4 w-4" /> 051-57223772
          </a>
          <Link to="/cart" className="relative p-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary-soft transition-colors">
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {count.toLocaleString("fa-IR")}
              </span>
            )}
          </Link>
          <button className="lg:hidden p-2.5 rounded-full border border-primary/20" onClick={() => setOpen(o => !o)}>
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-primary/10 bg-parchment">
          <nav className="container py-4 grid gap-1">
            {nav.map(n =>
              "href" in n ? (
                <a key={n.href} href={n.href} target="_blank" rel="noreferrer"
                  title="تعیین سطح زبان انگلیسی با هوش مصنوعی"
                  className="px-4 py-3 rounded-lg font-bold text-primary">
                  {n.label}
                </a>
              ) : (
                <NavLink key={n.to} to={n.to}
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
