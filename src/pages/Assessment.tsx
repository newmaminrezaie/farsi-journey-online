import { useState } from "react";
import { toast } from "sonner";
import { registrationsApi } from "@/lib/api";
import { ClipboardCheck, Sparkles, Clock, Phone, GraduationCap } from "lucide-react";

const EXPERIENCE = [
  "هیچ آشنایی ندارم (مبتدی مطلق)",
  "کمی آشنایی دارم (الفبا و جملات ساده)",
  "قبلاً کلاس رفته‌ام (متوسط)",
  "می‌توانم مکالمه کنم (پیشرفته)",
];

const TIMES = [
  "صبح (۹ تا ۱۲)",
  "ظهر (۱۲ تا ۱۵)",
  "عصر (۱۵ تا ۱۸)",
  "شب (۱۸ تا ۲۱)",
];

export default function Assessment() {
  const [form, setForm] = useState({
    fullName: "", phone: "", landline: "",
    age: "", eduLevel: "",
    experience: "", preferredTime: "",
    goal: "", note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName) return toast.error("نام و نام خانوادگی الزامی است");
    if (!form.phone) return toast.error("شماره همراه الزامی است");
    if (!form.experience) return toast.error("لطفاً سطح فعلی خود را انتخاب کنید");
    if (!form.preferredTime) return toast.error("لطفاً زمان مناسب برای تماس را انتخاب کنید");

    setSubmitting(true);
    try {
      await registrationsApi.create({
        semesterId: null,
        fullName: form.fullName,
        phone: form.phone,
        landline: form.landline,
        birthPlace: form.age,
        schoolDegree: form.eduLevel,
        levelInterest: form.experience,
        termInterest: "درخواست تعیین سطح",
        note: [
          "◆ درخواست تعیین سطح ◆",
          `زمان مناسب تماس: ${form.preferredTime}`,
          form.goal ? `هدف از یادگیری: ${form.goal}` : "",
          form.note ? `توضیحات: ${form.note}` : "",
        ].filter(Boolean).join("\n"),
        agreedToTerms: true,
      });
      setSubmitting(false);
      setDone(true);
      toast.success("درخواست شما ثبت شد. همکاران ما به‌زودی با شما تماس می‌گیرند.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setSubmitting(false);
      toast.error(err?.message || "ارسال ناموفق بود");
    }
  }

  return (
    <section className="relative py-20 bg-parchment overflow-hidden min-h-[70vh]">
      <div className="absolute inset-0 tile-bg-navy opacity-30" />
      <div className="container relative max-w-4xl">
        <div className="text-center mb-10">
          <div className="chip-gold inline-flex mb-4">رایگان و بدون تعهد</div>
          <h1 className="text-4xl md:text-5xl mb-3 text-primary flex items-center justify-center gap-3">
            <ClipboardCheck className="h-10 w-10 text-gold" /> تعیین سطح
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-8 max-w-2xl mx-auto">
            برای شرکت در دوره‌های آموزشگاه گویا، ابتدا سطح زبان شما به‌صورت رایگان توسط اساتید مجرب ما ارزیابی می‌شود تا در مناسب‌ترین کلاس قرار بگیرید.
          </p>
        </div>

        {done ? (
          <div className="bg-card p-10 rounded-3xl border border-gold/40 shadow-soft text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-gold/15 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-gold" />
            </div>
            <h2 className="text-2xl text-primary">درخواست شما با موفقیت ثبت شد</h2>
            <p className="text-foreground/80 leading-8 max-w-lg mx-auto">
              کارشناسان آموزشگاه گویا در نخستین فرصت با شما تماس گرفته و جلسه‌ی تعیین سطح را هماهنگ خواهند کرد.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {/* Info column */}
            <aside className="md:col-span-1 space-y-4">
              <div className="bg-primary text-primary-foreground rounded-2xl p-5 shadow-navy">
                <h3 className="font-black text-lg mb-3 flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> چرا تعیین سطح؟</h3>
                <ul className="text-sm leading-7 space-y-2 opacity-90 list-disc pr-5">
                  <li>قرارگیری در کلاسی متناسب با توانایی شما</li>
                  <li>پیشرفت سریع‌تر و اثربخش‌تر</li>
                  <li>معرفی بهترین استاد و کتاب برای شما</li>
                </ul>
              </div>
              <div className="bg-card border border-primary/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Clock className="h-5 w-5 text-gold" /> مدت جلسه
                </div>
                <p className="text-sm text-foreground/80 leading-7">حدود ۱۵ تا ۲۰ دقیقه — به صورت حضوری در آموزشگاه یا تلفنی.</p>
                <div className="flex items-center gap-2 text-primary font-bold pt-2 border-t border-primary/10">
                  <Phone className="h-5 w-5 text-gold" /> پشتیبانی
                </div>
                <p className="text-sm text-foreground/80 leading-7" dir="ltr">۰۵۱-۵۷۲۲۳۷۷۲</p>
              </div>
            </aside>

            {/* Form */}
            <form onSubmit={submit} className="md:col-span-2 bg-card p-6 md:p-8 rounded-3xl border border-primary/10 shadow-soft space-y-6">
              <fieldset className="space-y-4">
                <legend className="text-lg font-black text-primary mb-2">مشخصات شما</legend>
                <div className="grid sm:grid-cols-2 gap-4">
                  <F label="نام و نام خانوادگی *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls} required /></F>
                  <F label="سن"><input value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} className={inputCls} placeholder="مثلاً ۱۴" /></F>
                  <F label="همراه *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" required /></F>
                  <F label="تلفن ثابت"><input value={form.landline} onChange={e => setForm({ ...form, landline: e.target.value })} className={inputCls} dir="ltr" /></F>
                  <div className="sm:col-span-2">
                    <F label="پایه تحصیلی"><input value={form.eduLevel} onChange={e => setForm({ ...form, eduLevel: e.target.value })} className={inputCls} placeholder="مثلاً هشتم / دیپلم / کارشناسی" /></F>
                  </div>
                </div>
              </fieldset>

              <fieldset className="space-y-4 pt-2 border-t border-primary/10">
                <legend className="text-lg font-black text-primary mb-2 pt-4">سطح فعلی زبان</legend>
                <F label="آشنایی فعلی شما با زبان انگلیسی *">
                  <select value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} className={inputCls} required>
                    <option value="">— انتخاب کنید —</option>
                    {EXPERIENCE.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </F>
                <F label="هدف شما از یادگیری زبان">
                  <input value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} className={inputCls} placeholder="مثلاً مکالمه، مهاجرت، آیلتس، تحصیل" />
                </F>
              </fieldset>

              <fieldset className="space-y-4 pt-2 border-t border-primary/10">
                <legend className="text-lg font-black text-primary mb-2 pt-4">هماهنگی جلسه</legend>
                <F label="زمان مناسب برای تماس *">
                  <select value={form.preferredTime} onChange={e => setForm({ ...form, preferredTime: e.target.value })} className={inputCls} required>
                    <option value="">— انتخاب کنید —</option>
                    {TIMES.map(x => <option key={x} value={x}>{x}</option>)}
                  </select>
                </F>
                <F label="توضیحات (اختیاری)">
                  <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls + " min-h-20"} />
                </F>
              </fieldset>

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                <GraduationCap className="h-5 w-5" /> {submitting ? "در حال ارسال…" : "ثبت درخواست تعیین سطح"}
              </button>
              <p className="text-xs text-center text-muted-foreground">این خدمت کاملاً رایگان است و نیازی به پرداخت ندارد.</p>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}

const inputCls = "w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3 text-sm text-primary focus:outline-none focus:border-gold";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-sm font-bold text-primary mb-1.5">{label}</span>{children}</label>;
}
