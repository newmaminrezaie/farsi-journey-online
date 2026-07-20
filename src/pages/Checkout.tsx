import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ordersApi, cartApi, formatToman, booksApi, paymentsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Info, ShieldCheck } from "lucide-react";

export default function Checkout() {
  const nav = useNavigate();
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });
  const items = cartApi.read();
  const rows = items.map(i => ({ ...i, book: books.find(b => b.id === i.bookId) })).filter(r => r.book);
  const total = rows.reduce((s, r) => s + r.qty * (r.book!.priceToman), 0);

  const [form, setForm] = useState({ customerName: "", phone: "", address: "", note: "" });
  const [method, setMethod] = useState<"zarinpal" | "cash-on-delivery">("zarinpal");
  const [submitting, setSubmitting] = useState(false);

  if (items.length === 0) {
    return <div className="container py-40 text-center text-muted-foreground">سبد خرید خالی است.</div>;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName || !form.phone || !form.address) return toast.error("همه فیلدها را پر کنید");
    setSubmitting(true);
    try {
      const order = await ordersApi.createFromCart({ ...form, paymentMethod: method });
      if (method === "zarinpal") {
        const { url } = await paymentsApi.startZarinpal("order", order.id);
        window.location.href = url;
        return;
      }
      toast.success("سفارش شما ثبت شد.");
      nav(`/order/${order.refCode}`);
    } catch (err: any) {
      toast.error(err?.message || "خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="container py-16 grid lg:grid-cols-[1fr_400px] gap-8 max-w-6xl">
      <form onSubmit={submit} className="space-y-6">
        <h1 className="text-4xl mb-4 text-primary">تکمیل خرید</h1>
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-primary/10 space-y-4">
          <h3 className="text-lg text-primary mb-4">اطلاعات گیرنده</h3>
          <F label="نام و نام خانوادگی *"><input value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className={inp} /></F>
          <F label="شماره تماس *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inp} /></F>
          <F label="آدرس کامل *"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inp + " min-h-24"} /></F>
          <F label="توضیحات"><textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inp + " min-h-16"} /></F>
        </div>

        <div className="bg-card rounded-3xl p-6 md:p-8 border border-primary/10">
          <h3 className="text-lg text-primary mb-4">شیوه پرداخت</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === "zarinpal" ? "border-gold bg-gold/10" : "border-primary/10"}`}>
              <input type="radio" checked={method === "zarinpal"} onChange={() => setMethod("zarinpal")} className="hidden" />
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-gold" />
                <div>
                  <div className="font-bold text-primary">پرداخت آنلاین (زرین‌پال)</div>
                  <div className="text-xs text-muted-foreground mt-1">پرداخت امن با کارت‌های عضو شتاب</div>
                </div>
              </div>
            </label>
            <label className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${method === "cash-on-delivery" ? "border-gold bg-gold/10" : "border-primary/10"}`}>
              <input type="radio" checked={method === "cash-on-delivery"} onChange={() => setMethod("cash-on-delivery")} className="hidden" />
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-turquoise" />
                <div>
                  <div className="font-bold text-primary">پرداخت در محل</div>
                  <div className="text-xs text-muted-foreground mt-1">هنگام دریافت پرداخت کنید</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={submitting} className={method === "zarinpal" ? "btn-gold w-full" : "btn-primary w-full"}>
          {method === "zarinpal" && <ShieldCheck className="h-5 w-5" />}
          {submitting
            ? (method === "zarinpal" ? "در حال انتقال به درگاه…" : "در حال ثبت…")
            : (method === "zarinpal" ? "پرداخت با زرین‌پال" : "ثبت سفارش")}
        </button>
      </form>

      <aside className="bg-primary text-primary-foreground rounded-3xl p-6 h-fit sticky top-24 relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-40" />
        <div className="relative">
          <h4 className="text-lg mb-4">خلاصه سفارش</h4>
          <div className="space-y-2 mb-4 pb-4 border-b border-gold/25">
            {rows.map(r => (
              <div key={r.bookId} className="flex justify-between text-sm">
                <span className="text-primary-foreground/85">{r.book!.titleFa} × {r.qty}</span>
                <span>{formatToman(r.qty * r.book!.priceToman)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-primary-foreground/70">مبلغ نهایی</span>
            <span className="text-2xl font-black text-gold">{formatToman(total)}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}

const inp = "w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3 text-sm text-primary focus:outline-none focus:border-gold";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-sm font-bold text-primary mb-1.5">{label}</span>{children}</label>;
}
