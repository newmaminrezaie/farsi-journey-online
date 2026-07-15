import { useEffect, useState } from "react";
import { Outlet, NavLink, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { LayoutDashboard, BookOpen, GraduationCap, Users, UserCog, ShoppingBag, ClipboardList, Megaphone, LogOut, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo-fa.png";

const links = [
  { to: "/admin/dashboard", label: "داشبورد", icon: LayoutDashboard },
  { to: "/admin/semesters", label: "کلاس‌ها", icon: GraduationCap },
  { to: "/admin/teachers", label: "اساتید", icon: Users },
  { to: "/admin/employees", label: "کارکنان", icon: UserCog },
  { to: "/admin/books", label: "کتاب‌ها", icon: BookOpen },
  { to: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
  { to: "/admin/registrations", label: "ثبت‌نام‌ها", icon: ClipboardList },
  { to: "/admin/promo", label: "بنر تبلیغاتی", icon: Megaphone },
];

export default function AdminLayout() {
  const nav = useNavigate();
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const onExpired = () => setExpired(true);
    window.addEventListener("hg:session-expired", onExpired);
    return () => window.removeEventListener("hg:session-expired", onExpired);
  }, []);
  if (!authApi.isLoggedIn()) return <Navigate to="/admin/login" replace />;

  return (
    <div className="min-h-screen bg-parchment">
      <aside className="fixed top-0 right-0 h-full w-64 bg-primary text-primary-foreground p-6 relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-40 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-8">
            <img src={logo} alt="" className="h-12 w-12 bg-parchment rounded-lg p-1" />
            <div>
              <div className="text-xs text-primary-foreground/70">پنل مدیریت</div>
              <div className="font-black">HiGooya</div>
            </div>
          </div>
          <nav className="space-y-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  isActive ? "bg-gold text-gold-foreground" : "text-primary-foreground/85 hover:bg-white/5"}`}>
                <l.icon className="h-4 w-4" /> {l.label}
              </NavLink>
            ))}
          </nav>
          <button onClick={async () => { await authApi.logout(); nav("/admin/login"); }}
                  className="mt-8 flex items-center gap-2 px-4 py-2.5 text-sm text-primary-foreground/70 hover:text-gold">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </aside>
      <main className="mr-64 p-8">
        {expired && (
          <div className="mb-6 rounded-2xl border-2 border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-black text-destructive mb-1">نشست شما منقضی شده است</div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                برای ادامهٔ کار لطفاً یک‌بار از پنل <strong>خروج</strong> بزنید و دوباره وارد شوید. تا زمانی که این کار را انجام ندهید، ذخیره و ویرایش ممکن است با خطای ۴۰۱/۴۰۰ روبه‌رو شود.
              </p>
              <button
                onClick={async () => { await authApi.logout(); nav("/admin/login"); }}
                className="btn-primary mt-3 !py-2 !px-4 text-sm"
              >
                <LogOut className="h-4 w-4" /> خروج و ورود مجدد
              </button>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
