import { useQuery } from "@tanstack/react-query";
import { booksApi, ordersApi, registrationsApi, semestersApi, formatToman } from "@/lib/api";
import { BookOpen, GraduationCap, ShoppingBag, ClipboardList } from "lucide-react";

export default function Dashboard() {
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: () => semestersApi.list() });
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.list() });
  const { data: regs = [] } = useQuery({ queryKey: ["registrations"], queryFn: () => registrationsApi.list() });

  const pendingOrders = orders.filter(o => o.status === "pending");
  const newRegs = regs.filter(r => r.status === "new");
  const revenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.subtotalToman, 0);

  return (
    <div>
      <h1 className="text-3xl mb-2 text-primary">داشبورد</h1>
      <p className="text-muted-foreground mb-8">نگاهی سریع به وضعیت آموزشگاه</p>
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Stat icon={<GraduationCap />} label="ترم‌های فعال" value={semesters.filter(s => s.status === "open").length} />
        <Stat icon={<BookOpen />} label="کتاب‌ها" value={books.length} />
        <Stat icon={<ShoppingBag />} label="سفارش‌های در انتظار" value={pendingOrders.length} accent />
        <Stat icon={<ClipboardList />} label="ثبت‌نام جدید" value={newRegs.length} accent />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-3xl p-6 border border-primary/10">
          <h3 className="text-lg text-primary mb-4">آخرین سفارش‌ها</h3>
          <div className="space-y-2 text-sm">
            {orders.slice(0, 5).map(o => (
              <div key={o.id} className="flex justify-between py-2 border-b border-primary/5 last:border-0">
                <span>{o.refCode} — {o.customerName}</span>
                <span className="font-bold text-primary">{formatToman(o.subtotalToman)}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="text-muted-foreground">هنوز سفارشی ثبت نشده.</p>}
          </div>
        </div>
        <div className="bg-card rounded-3xl p-6 border border-primary/10">
          <h3 className="text-lg text-primary mb-4">آخرین ثبت‌نام‌ها</h3>
          <div className="space-y-2 text-sm">
            {regs.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between py-2 border-b border-primary/5 last:border-0">
                <span>{r.fullName}</span>
                <span className="text-muted-foreground">{r.phone}</span>
              </div>
            ))}
            {regs.length === 0 && <p className="text-muted-foreground">هنوز ثبت‌نامی وجود ندارد.</p>}
          </div>
        </div>
      </div>
      <div className="mt-6 bg-primary text-primary-foreground rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-40" />
        <div className="relative flex justify-between items-baseline">
          <div>
            <div className="text-sm text-primary-foreground/70">مجموع فروش</div>
            <div className="text-4xl font-black text-gold mt-1">{formatToman(revenue)}</div>
          </div>
          <div className="text-xs text-primary-foreground/60">داده‌ی محلی — بعد از اتصال بک‌اند از سرور خوانده می‌شود.</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, accent }: any) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-gold/15 border-gold/40" : "bg-card border-primary/10"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${accent ? "bg-gold text-gold-foreground" : "bg-primary/10 text-primary"}`}>{icon}</div>
      <div className="text-3xl font-black text-primary">{value.toLocaleString("fa-IR")}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
