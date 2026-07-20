import { useLocation, useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatToman, paymentsApi } from "@/lib/api";
import { CreditCard, ShieldCheck, BookOpen, GraduationCap, BadgePercent, ArrowRight } from "lucide-react";

type PayState = {
  registrationId?: string;
  registrantName: string;
  phone: string;
  semester: { id: string; titleFa: string; priceToman: number };
  book?: { id: string; titleFa: string; priceToman: number; coverUrl?: string } | null;
};

export default function RegistrationPayment() {
  const nav = useNavigate();
  const loc = useLocation();
  const state = loc.state as PayState | null;
  const [submitting, setSubmitting] = useState(false);

  const totals = useMemo(() => {
    const tuition = state?.semester.priceToman ?? 0;
    const bookOriginal = state?.book?.priceToman ?? 0;
    const bookDiscount = Math.round(bookOriginal * 0.05);
    const bookFinal = bookOriginal - bookDiscount;
    return { tuition, bookOriginal, bookDiscount, bookFinal, total: tuition + bookFinal };
  }, [state]);

  if (!state) {
    return (
      <div className="container py-32 text-center">
        <p className="text-muted-foreground mb-4">اطلاعات پرداخت در دسترس نیست.</p>
        <Link to="/semesters" className="btn-primary">مشاهده کلاس‌ها</Link>
      </div>
    );
  }

  async function pay() {
    if (!state?.registrationId) {
      toast.error("شناسه ثبت‌نام یافت نشد. لطفاً فرم را دوباره ارسال کنید.");
      return;
    }
    setSubmitting(true);
    try {
      const { url } = await paymentsApi.startZarinpal("registration", state.registrationId);
      window.location.href = url;
    } catch (e: any) {
      setSubmitting(false);
      toast.error(e?.message || "اتصال به درگاه پرداخت ممکن نشد");
    }
  }



  return (
    <section className="container py-16 max-w-5xl grid lg:grid-cols-[1fr_400px] gap-8">
      <div className="space-y-6">
        <button onClick={() => nav(-1)} className="inline-flex items-center gap-2 text-primary/70 hover:text-primary">
          <ArrowRight className="h-4 w-4" /> بازگشت به فرم ثبت‌نام
        </button>
        <div>
          <div className="chip-gold inline-flex mb-4">مرحله پرداخت</div>
          <h1 className="text-4xl mb-2 text-primary">تکمیل ثبت‌نام با پرداخت شهریه</h1>
          <p className="text-muted-foreground leading-8">
            فرم ثبت‌نام شما با موفقیت دریافت شد. برای قطعی شدن جایگاه در کلاس،
            لطفاً شهریهٔ دوره {state.book ? "و مبلغ کتاب انتخاب‌شده" : ""} را از طریق درگاه امن زرین‌پال پرداخت کنید.
          </p>
        </div>

        <div className="bg-card rounded-3xl border border-primary/10 p-6 md:p-8 space-y-5">
          <h3 className="text-lg text-primary flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-gold" /> اقلام قابل پرداخت
          </h3>
          <LineItem
            title={`شهریه — ${state.semester.titleFa}`}
            subtitle={`زبان‌آموز: ${state.registrantName}`}
            price={totals.tuition}
          />
          {state.book && (
            <LineItem
              title={`کتاب — ${state.book.titleFa}`}
              subtitle="ارسال پیش از شروع کلاس"
              price={totals.bookFinal}
              strikethrough={totals.bookOriginal}
              badge={<span className="chip-gold text-xs"><BadgePercent className="h-3 w-3 inline" /> ۵٪ تخفیف</span>}
              icon={<BookOpen className="h-4 w-4 text-gold" />}
            />
          )}
        </div>

        <div className="bg-card rounded-3xl border border-primary/10 p-6 md:p-8">
          <h3 className="text-lg text-primary mb-4 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gold" /> شیوه پرداخت
          </h3>
          <div className="p-4 rounded-2xl border-2 border-gold bg-gold/10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold text-primary flex items-center justify-center shadow-gold shrink-0">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-primary">درگاه پرداخت آنلاین زرین‌پال</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                انتقال به درگاه امن، تسویه با شماره‌کارت‌های تمام بانک‌های ایران.
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside className="bg-primary text-primary-foreground rounded-3xl p-6 h-fit lg:sticky lg:top-24 relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-40" />
        <div className="relative">
          <h4 className="text-lg mb-4">خلاصه پرداخت</h4>
          <div className="space-y-2 mb-4 pb-4 border-b border-gold/25 text-sm">
            <SummaryRow label="شهریه دوره" value={formatToman(totals.tuition)} />
            {state.book && (
              <>
                <SummaryRow label="قیمت کتاب" value={formatToman(totals.bookOriginal)} />
                <SummaryRow label="تخفیف کتاب (۵٪)" value={"−" + formatToman(totals.bookDiscount)} accent />
              </>
            )}
          </div>
          <div className="flex justify-between items-baseline mb-6">
            <span className="text-primary-foreground/70">مبلغ نهایی</span>
            <span className="text-2xl font-black text-gold">{formatToman(totals.total)}</span>
          </div>
          <button
            onClick={pay}
            disabled={submitting}
            className="btn-gold w-full"
          >
            <ShieldCheck className="h-5 w-5" />
            {submitting ? "در حال انتقال به درگاه…" : "پرداخت با زرین‌پال"}
          </button>
          <p className="text-[11px] text-primary-foreground/60 mt-3 leading-6 text-center">
            با کلیک روی دکمهٔ پرداخت، به درگاه امن زرین‌پال منتقل می‌شوید.
          </p>
        </div>
      </aside>
    </section>
  );
}

function LineItem({
  title, subtitle, price, strikethrough, badge, icon,
}: {
  title: string; subtitle?: string; price: number; strikethrough?: number; badge?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 pb-4 border-b border-primary/10 last:border-b-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-primary flex items-center gap-2">{icon}{title}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>}
        {badge && <div className="mt-2">{badge}</div>}
      </div>
      <div className="text-left shrink-0">
        {strikethrough && strikethrough !== price && (
          <div className="text-xs text-muted-foreground line-through">{formatToman(strikethrough)}</div>
        )}
        <div className="text-lg font-black text-gold">{formatToman(price)}</div>
      </div>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between text-sm ${muted ? "text-turquoise" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function SummaryRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-primary-foreground/80">{label}</span>
      <span className={accent ? "text-turquoise font-bold" : "text-primary-foreground"}>{value}</span>
    </div>
  );
}
