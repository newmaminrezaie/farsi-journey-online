import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Phone } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { cartApi } from "@/lib/api";

const nav = [
  { to: "/", label: "خانه" },
  { to: "/semesters", label: "ترم‌ها" },
  { to: "/teachers", label: "اساتید" },
  { to: "/shop", label: "کتاب فروشی" },
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
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-primary hover:bg-gold/15"
                }`
              }>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href="tel:+985157220000" className="hidden md:inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold transition-colors">
            <Phone className="h-4 w-4" /> ۰۵۷ ۵۷۲۲ ۰۰۰۰
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
            {nav.map(n => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-lg font-bold ${isActive ? "bg-primary text-primary-foreground" : "text-primary"}`
                }>
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
