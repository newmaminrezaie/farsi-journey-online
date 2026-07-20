import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { ordersApi, formatToman } from "@/lib/api";

export default function PaymentResult() {
  const [sp] = useSearchParams();
  const status = sp.get("status") ?? "failed";
  const kind = sp.get("kind") ?? "";
  const target = sp.get("target") ?? "";
  const ref = sp.get("ref") ?? "";
  const reason = sp.get("reason") ?? "";
  const amount = Number(sp.get("amount") ?? "0");

  const [order, setOrder] = useState<any>(null);
  useEffect(() => {
    if (kind === "order" && target) {
      ordersApi.get(target).then(setOrder).catch(() => {});
    }
  }, [kind, target]);

  const ok = status === "ok";
  const cancelled = status === "cancelled";

  const title = ok
    ? "پرداخت با موفقیت انجام شد"
    : cancelled
    ? "پرداخت لغو شد"
    : "پرداخت ناموفق بود";

  const Icon = ok ? CheckCircle2 : cancelled ? AlertCircle : XCircle;
  const iconColor = ok ? "text-turquoise" : cancelled ? "text-gold" : "text-destructive";

  const retryHref = useMemo(() => {
    if (kind === "order" && order?.refCode) return `/order/${order.refCode}`;
    if (kind === "registration") return `/register`;
    return "/";
  }, [kind, order]);

  return (
    <section className="container py-16 max-w-2xl">
      <div className="bg-card rounded-3xl p-10 border border-gold/40 text-center shadow-soft">
        <Icon className={`h-20 w-20 mx-auto mb-6 ${iconColor}`} />
        <h1 className="text-3xl md:text-4xl mb-3 text-primary">{title}</h1>

        {ok && (
          <>
            <p className="text-muted-foreground mb-2">
              {kind === "registration"
                ? "ثبت‌نام شما قطعی شد. جزئیات کلاس به‌زودی پیامک می‌شود."
                : "سفارش شما پرداخت شد و به‌زودی برای هماهنگی ارسال با شما تماس می‌گیریم."}
            </p>
            {ref && (
              <p className="text-muted-foreground mb-6">
                کد رهگیری پرداخت: <span className="font-black text-primary tracking-wider">{ref}</span>
              </p>
            )}
            {amount > 0 && (
              <div className="bg-parchment rounded-2xl p-5 mb-6 inline-block">
                <div className="text-sm text-muted-foreground mb-1">مبلغ پرداخت‌شده</div>
                <div className="text-2xl font-black text-gold">{formatToman(amount)}</div>
              </div>
            )}
          </>
        )}

        {!ok && (
          <p className="text-muted-foreground mb-6 leading-8">
            {cancelled
              ? "شما پرداخت را لغو کردید. می‌توانید دوباره تلاش کنید."
              : reason === "post_verify"
              ? "پرداخت شما در درگاه انجام شد ولی ثبت نهایی با خطا مواجه شد. لطفاً با پشتیبانی تماس بگیرید."
              : "درگاه پرداخت پاسخ منفی داد. اگر مبلغی از حساب شما کسر شده، طی ۷۲ ساعت بازگردانده می‌شود."}
            {reason && reason !== "post_verify" && (
              <span className="block text-xs mt-2">کد خطا: {reason}</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/" className="btn-ghost">بازگشت به خانه</Link>
          {!ok && <Link to={retryHref} className="btn-primary">تلاش دوباره</Link>}
          {ok && kind === "order" && order?.refCode && (
            <Link to={`/order/${order.refCode}`} className="btn-primary">مشاهده سفارش</Link>
          )}
        </div>
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _keep = Loader2;
