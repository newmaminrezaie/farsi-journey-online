import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ordersApi, formatToman } from "@/lib/api";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccess() {
  const { ref } = useParams();
  const { data: order } = useQuery({ queryKey: ["order", ref], queryFn: () => ordersApi.get(ref!), enabled: !!ref });

  if (!order) return <div className="container py-40 text-center text-muted-foreground">در حال بارگذاری…</div>;

  return (
    <section className="container py-16 max-w-2xl">
      <div className="bg-card rounded-3xl p-10 border border-gold/40 text-center shadow-soft">
        <CheckCircle2 className="h-20 w-20 text-turquoise mx-auto mb-6" />
        <h1 className="text-3xl md:text-4xl mb-3 text-primary">سفارش شما ثبت شد</h1>
        <p className="text-muted-foreground mb-6">کد پیگیری: <span className="font-black text-primary">{order.refCode}</span></p>

        <div className="bg-parchment rounded-2xl p-5 text-right space-y-2 mb-6">
          {order.items.map(i => (
            <div key={i.bookId} className="flex justify-between text-sm">
              <span>{i.titleFa} × {i.qty.toLocaleString("fa-IR")}</span>
              <span>{formatToman(i.qty * i.unitPriceToman)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-3 border-t border-primary/10 font-black text-primary">
            <span>مبلغ نهایی</span>
            <span>{formatToman(order.subtotalToman)}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {order.status === "paid"
            ? "پرداخت شما با موفقیت انجام شد. برای هماهنگی ارسال با شما تماس می‌گیریم."
            : order.paymentMethod === "zarinpal"
            ? "این سفارش هنوز پرداخت نشده. لطفاً از طریق پیامک ارسال‌شده پرداخت را تکمیل کنید."
            : "کارشناسان ما برای هماهنگی ارسال و دریافت وجه با شما تماس می‌گیرند."}
        </p>
        <Link to="/" className="btn-primary">بازگشت به خانه</Link>
      </div>
    </section>
  );
}
