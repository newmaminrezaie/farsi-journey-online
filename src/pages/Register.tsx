import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { registrationsApi } from "@/lib/api";
import { GraduationCap, ScrollText } from "lucide-react";

const LEVELS = [
  { v: "beginner", l: "مقدماتی" },
  { v: "elementary", l: "پایه" },
  { v: "pre-intermediate", l: "پیش‌متوسط" },
  { v: "intermediate", l: "متوسط" },
  { v: "upper-intermediate", l: "فوق متوسط" },
  { v: "advanced", l: "پیشرفته" },
  { v: "ielts", l: "آیلتس" },
];

const TERMS = [
  "این مرکز تابع مقررات پوششی و رفتاری آموزش و پرورش است، لذا از نظر رفتار و پوشش و حجاب کاملاً همانند مدارس می‌باشد.",
  "تکمیل فرم ثبت‌نام و واریز شهریه به منزله ثبت‌نام قطعی تلقی شده و در صورت انصراف مبلغ شهریه استرداد نخواهد شد، مگر در مواردی که از طرف آموزشگاه تعطیل یا منحل گردد.",
  "غیبت بیش از ۴ جلسه موجه یا غیر موجه در طول ترم باعث محرومیت از امتحان و در نتیجه عدم دریافت گواهینامه می‌شود.",
  "آموزشگاه در خصوص رفت و برگشت شما به کلاس هیچ‌گونه مسئولیتی ندارد.",
];

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "", fatherName: "", birthCertNo: "", nationalId: "",
    issuedFrom: "", birthPlace: "", education: "",
    address: "", phone: "", landline: "",
    levelInterest: "beginner", note: "", agreedToTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error("نام و شماره همراه الزامی است");
    if (!form.agreedToTerms) return toast.error("لطفاً مقررات ثبت‌نام را تأیید کنید");
    setSubmitting(true);
    await registrationsApi.create({
      semesterId: null,
      fullName: form.fullName,
      fatherName: form.fatherName,
      birthCertNo: form.birthCertNo,
      nationalId: form.nationalId,
      issuedFrom: form.issuedFrom,
      birthPlace: form.birthPlace,
      education: form.education,
      address: form.address,
      phone: form.phone,
      landline: form.landline,
      levelInterest: form.levelInterest as any,
      note: form.note,
      agreedToTerms: form.agreedToTerms,
    });
    setSubmitting(false);
    toast.success("درخواست شما ثبت شد. کارشناسان گویا به‌زودی تماس می‌گیرند.");
    nav("/");
  }

  return (
    <section className="relative py-20 bg-parchment overflow-hidden">
      <div className="absolute inset-0 tile-bg-gold opacity-40" />
      <div className="container relative max-w-3xl">
        <div className="text-center mb-10">
          <div className="chip-gold inline-flex mb-4">فرم ثبت‌نام</div>
          <h1 className="text-4xl md:text-5xl mb-3 text-primary">فرم ثبت‌نام آموزشگاه زبان گویا</h1>
          <p className="text-muted-foreground">اطلاعات زیر را با دقت تکمیل کنید.</p>
        </div>

        <form onSubmit={submit} className="bg-card p-8 md:p-10 rounded-3xl border border-primary/10 shadow-soft space-y-6">
          {/* مشخصات فردی */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-black text-primary mb-2">مشخصات زبان‌آموز</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="نام و نام خانوادگی (زبان‌آموز) *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls} /></F>
              <F label="نام پدر"><input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} className={inputCls} /></F>
              <F label="شماره شناسنامه"><input value={form.birthCertNo} onChange={e => setForm({ ...form, birthCertNo: e.target.value })} className={inputCls} /></F>
              <F label="کد ملی"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} className={inputCls} /></F>
              <F label="صادره از"><input value={form.issuedFrom} onChange={e => setForm({ ...form, issuedFrom: e.target.value })} className={inputCls} /></F>
              <F label="متولد"><input value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })} className={inputCls} placeholder="محل تولد / سال تولد" /></F>
              <div className="sm:col-span-2">
                <F label="دارای مدرک تحصیلی (مدرسه / دانشگاه)"><input value={form.education} onChange={e => setForm({ ...form, education: e.target.value })} className={inputCls} /></F>
              </div>
            </div>
          </fieldset>

          {/* تماس */}
          <fieldset className="space-y-4 pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-2 pt-4">اطلاعات تماس</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="تلفن ثابت"><input value={form.landline} onChange={e => setForm({ ...form, landline: e.target.value })} className={inputCls} dir="ltr" /></F>
              <F label="همراه *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" /></F>
              <div className="sm:col-span-2">
                <F label="آدرس"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls + " min-h-20"} /></F>
              </div>
            </div>
          </fieldset>

          {/* سطح مورد نظر */}
          <fieldset className="space-y-4 pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-2 pt-4">دوره مورد نظر</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="سطح مورد نظر">
                <select value={form.levelInterest} onChange={e => setForm({ ...form, levelInterest: e.target.value })} className={inputCls}>
                  {LEVELS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
                </select>
              </F>
              <F label="توضیحات">
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls + " min-h-12"} />
              </F>
            </div>
          </fieldset>

          {/* مقررات */}
          <fieldset className="pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-3 pt-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-gold" /> مقررات ثبت‌نام
            </legend>
            <div className="bg-parchment/60 border border-primary/10 rounded-2xl p-5">
              <p className="text-sm text-primary mb-3">
                ضمناً اینجانب تعهد می‌کنم تمام مقررات زیر را رعایت کنم:
              </p>
              <ol className="list-decimal pr-5 space-y-2 text-sm text-foreground/85 leading-7">
                {TERMS.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
              <label className="flex items-start gap-3 mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.agreedToTerms}
                  onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })}
                  className="mt-1 h-5 w-5 accent-[hsl(var(--gold))]"
                />
                <span className="text-sm font-bold text-primary">
                  مقررات فوق را مطالعه کرده و می‌پذیرم.
                </span>
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <GraduationCap className="h-5 w-5" /> {submitting ? "در حال ارسال…" : "ارسال درخواست ثبت‌نام"}
          </button>
        </form>
      </div>
    </section>
  );
}

const inputCls = "w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3 text-sm text-primary focus:outline-none focus:border-gold";

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-sm font-bold text-primary mb-1.5">{label}</span>{children}</label>;
}
