import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { registrationsApi, semestersApi } from "@/lib/api";
import type { Semester } from "@/lib/types";
import { GraduationCap, ScrollText } from "lucide-react";

const TERMS = [
  "این مرکز تابع مقررات پوششی و رفتاری آموزش و پرورش است، لذا از نظر رفتار و پوشش و حجاب کاملاً همانند مدارس می‌باشد.",
  "تکمیل فرم ثبت‌نام و واریز شهریه به منزله ثبت‌نام قطعی تلقی شده و در صورت انصراف مبلغ شهریه استرداد نخواهد شد، مگر در مواردی که از طرف آموزشگاه تعطیل یا منحل گردد.",
  "غیبت بیش از ۴ جلسه موجه یا غیر موجه در طول ترم باعث محرومیت از امتحان و در نتیجه عدم دریافت گواهینامه می‌شود.",
  "آموزشگاه در خصوص رفت و برگشت شما به کلاس هیچ‌گونه مسئولیتی ندارد.",
];

export default function Register() {
  const nav = useNavigate();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [form, setForm] = useState({
    semesterId: "",
    fullName: "", fatherName: "", birthCertNo: "",
    issuedFrom: "", birthPlace: "",
    schoolDegree: "", universityDegree: "",
    address: "", landline: "", phone: "", nationalId: "",
    termInterest: "", levelInterest: "",
    note: "", agreedToTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    semestersApi.listOpen().then(setSemesters).catch(() => setSemesters([]));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error("نام زبان‌آموز و شماره همراه الزامی است");
    if (!form.agreedToTerms) return toast.error("لطفاً مقررات ثبت‌نام را تأیید کنید");
    setSubmitting(true);
    const sem = form.semesterId ? semesters.find(s => s.id === form.semesterId) : null;
    try {
      const created = await registrationsApi.create({
        semesterId: sem?.id ?? null,
        fullName: form.fullName,
        fatherName: form.fatherName,
        birthCertNo: form.birthCertNo,
        nationalId: form.nationalId,
        issuedFrom: form.issuedFrom,
        birthPlace: form.birthPlace,
        schoolDegree: form.schoolDegree,
        universityDegree: form.universityDegree,
        address: form.address,
        phone: form.phone,
        landline: form.landline,
        termInterest: form.termInterest || sem?.titleFa || "",
        levelInterest: form.levelInterest,
        note: form.note,
        agreedToTerms: form.agreedToTerms,
      });
      setSubmitting(false);
      if (sem) {
        toast.success("فرم ثبت‌نام ثبت شد. لطفاً پرداخت را تکمیل کنید.");
        nav("/register/pay", {
          state: {
            registrationId: (created as any)?.id,
            registrantName: form.fullName,
            phone: form.phone,
            semester: { id: sem.id, titleFa: sem.titleFa, priceToman: sem.priceToman },
            book: null,
          },
        });
        return;
      }
      toast.success("درخواست شما ثبت شد. کارشناسان گویا به‌زودی تماس می‌گیرند.");
      nav("/");
    } catch (err: any) {
      setSubmitting(false);
      toast.error(err?.message || "ارسال ناموفق بود");
    }
  }

  return (
    <section className="relative py-20 bg-parchment overflow-hidden">
      <div className="absolute inset-0 tile-bg-gold opacity-40" />
      <div className="container relative max-w-3xl">
        <div className="text-center mb-10">
          <div className="chip-gold inline-flex mb-4">باسمه تعالی</div>
          <h1 className="text-4xl md:text-5xl mb-3 text-primary">فرم ثبت‌نام آموزشگاه زبان گویا</h1>
          <p className="text-muted-foreground text-sm">کد زبان‌آموز پس از ثبت‌نام به شما تخصیص داده خواهد شد.</p>
        </div>

        <form onSubmit={submit} className="bg-card p-8 md:p-10 rounded-3xl border border-primary/10 shadow-soft space-y-8">
          {/* Preamble matching the paper form */}
          <p className="text-primary leading-8 text-sm md:text-base">
            احتراماً اینجانب <b>(زبان‌آموز)</b> اطلاعات زیر را جهت ثبت‌نام در آموزشگاه زبان گویا اعلام می‌نمایم.
          </p>

          {/* انتخاب ترم — در صورت انتخاب، پس از ارسال به درگاه پرداخت هدایت می‌شوید */}
          <fieldset className="space-y-3">
            <legend className="text-lg font-black text-primary mb-2">انتخاب ترم (اختیاری)</legend>
            <F label="ترم مورد نظر">
              <select
                value={form.semesterId}
                onChange={e => setForm({ ...form, semesterId: e.target.value })}
                className={inputCls}
              >
                <option value="">— بدون انتخاب ترم (فقط ثبت درخواست و تماس بعدی) —</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.titleFa} — {(s.priceToman || 0).toLocaleString("fa-IR")} تومان
                  </option>
                ))}
              </select>
            </F>
            {form.semesterId ? (
              <p className="text-xs text-turquoise bg-turquoise/10 border border-turquoise/30 rounded-xl p-3 leading-6">
                برای قطعی شدن جایگاه شما در این ترم، پس از ارسال فرم به درگاه پرداخت زرین‌پال منتقل می‌شوید و می‌بایست شهریه را پرداخت کنید.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                اگر ترم خاصی مد نظر دارید انتخاب کنید تا پس از تکمیل فرم، شهریه را پرداخت کنید. در غیر این‌صورت کارشناسان ما با شما تماس خواهند گرفت.
              </p>
            )}
          </fieldset>



          {/* مشخصات فردی */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-black text-primary mb-2">مشخصات زبان‌آموز</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="نام و نام خانوادگی (زبان‌آموز) *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls} /></F>
              <F label="نام پدر"><input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} className={inputCls} /></F>
              <F label="شماره شناسنامه"><input value={form.birthCertNo} onChange={e => setForm({ ...form, birthCertNo: e.target.value })} className={inputCls} /></F>
              <F label="کد ملی"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} className={inputCls} /></F>
              <F label="صادره از"><input value={form.issuedFrom} onChange={e => setForm({ ...form, issuedFrom: e.target.value })} className={inputCls} /></F>
              <F label="متولد"><input value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })} className={inputCls} placeholder="محل و سال تولد" /></F>
            </div>
          </fieldset>

          {/* مدرک تحصیلی */}
          <fieldset className="space-y-4 pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-2 pt-4">دارای مدرک تحصیلی</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="مدرسه"><input value={form.schoolDegree} onChange={e => setForm({ ...form, schoolDegree: e.target.value })} className={inputCls} placeholder="مثلاً دیپلم / سوم متوسطه" /></F>
              <F label="دانشگاه"><input value={form.universityDegree} onChange={e => setForm({ ...form, universityDegree: e.target.value })} className={inputCls} placeholder="مثلاً کارشناسی / دکتری" /></F>
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

          {/* ترم و سطح — به‌شکل روایتی فرم کاغذی */}
          <fieldset className="pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-3 pt-4">ترم و سطح مورد نظر</legend>
            <div className="bg-parchment/60 border border-primary/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm text-primary leading-8">
                که نسبت به اهداف و کلاس‌های آموزشگاه زبان آشنایی کامل داشته و مایل به شرکت در ترم
                <input
                  value={form.termInterest}
                  onChange={e => setForm({ ...form, termInterest: e.target.value })}
                  className="inline-block mx-2 rounded-lg bg-card border border-primary/20 px-3 py-1 text-sm text-primary focus:outline-none focus:border-gold min-w-32"
                  placeholder="مثلاً پاییز ۱۴۰۴"
                />
                سطح
                <input
                  value={form.levelInterest}
                  onChange={e => setForm({ ...form, levelInterest: e.target.value })}
                  className="inline-block mx-2 rounded-lg bg-card border border-primary/20 px-3 py-1 text-sm text-primary focus:outline-none focus:border-gold min-w-32"
                  placeholder="مثلاً Elementary یا A2"
                />
                می‌باشم.
              </p>
              <F label="توضیحات (اختیاری)">
                <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls + " min-h-16"} />
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
