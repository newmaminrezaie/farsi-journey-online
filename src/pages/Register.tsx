import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { registrationsApi, semestersApi, teachersApi, booksApi, formatToman } from "@/lib/api";
import type { Book, Semester, Teacher } from "@/lib/types";
import { GraduationCap, ScrollText, BadgePercent, BookOpen } from "lucide-react";

const TERMS = [
  "این مرکز تابع مقررات پوششی و رفتاری آموزش و پرورش است، لذا از نظر رفتار و پوشش و حجاب کاملاً همانند مدارس می‌باشد.",
  "تکمیل فرم ثبت‌نام و واریز شهریه به منزله ثبت‌نام قطعی تلقی شده و در صورت انصراف مبلغ شهریه استرداد نخواهد شد، مگر در مواردی که از طرف آموزشگاه تعطیل یا منحل گردد.",
  "غیبت بیش از ۴ جلسه موجه یا غیر موجه در طول ترم باعث محرومیت از امتحان و در نتیجه عدم دریافت گواهینامه می‌شود.",
  "آموزشگاه در خصوص رفت و برگشت شما به کلاس هیچ‌گونه مسئولیتی ندارد.",
];

export default function Register() {
  const nav = useNavigate();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [form, setForm] = useState({
    semesterId: "",
    fullName: "", fatherName: "", nationalId: "",
    birthPlace: "", birthYear: "",
    eduLevel: "",
    address: "", landline: "", phone: "",
    selectedTeacherId: "", selectedBookId: "",
    note: "", agreedToTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    semestersApi.listOpen().then(setSemesters).catch(() => setSemesters([]));
    teachersApi.list().then(setTeachers).catch(() => setTeachers([]));
    booksApi.list().then(setBooks).catch(() => setBooks([]));
  }, []);

  const sem = useMemo(() => semesters.find(s => s.id === form.semesterId), [semesters, form.semesterId]);

  const teacherChoices = useMemo(() => {
    if (!sem) return [];
    const ids = (sem.teacherIds && sem.teacherIds.length ? sem.teacherIds : (sem.teacherId ? [sem.teacherId] : []));
    const filtered = teachers.filter(t => ids.includes(t.id));
    return filtered.length ? filtered : teachers;
  }, [sem, teachers]);

  const bookChoices = useMemo(() => {
    if (!sem) return [];
    const attached = books.filter(b => (sem.bookIds ?? []).includes(b.id));
    return attached.length ? attached : books.filter(b => b.active);
  }, [sem, books]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.semesterId) return toast.error("لطفاً کلاس مورد نظر خود را انتخاب کنید");
    if (!form.fullName) return toast.error("نام و نام خانوادگی الزامی است");
    if (!form.nationalId.trim()) return toast.error("کد ملی الزامی است");
    const yr = form.birthYear.replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();
    if (!/^\d{3,4}$/.test(yr)) return toast.error("سال تولد را به‌صورت عددی (مثلاً ۱۳۸۵) وارد کنید");
    if (!form.phone) return toast.error("شماره همراه الزامی است");
    if (!form.address) return toast.error("آدرس الزامی است");
    if (teacherChoices.length > 0 && !form.selectedTeacherId) return toast.error("لطفاً استاد مورد نظر خود را انتخاب کنید");
    if (!form.agreedToTerms) return toast.error("لطفاً مقررات ثبت‌نام را تأیید کنید");
    setSubmitting(true);
    try {
      const created = await registrationsApi.create({
        semesterId: sem!.id,
        fullName: form.fullName,
        fatherName: form.fatherName,
        birthCertNo: "",
        nationalId: form.nationalId,
        issuedFrom: yr,   // repurposed: سال تولد
        birthPlace: form.birthPlace,
        schoolDegree: form.eduLevel,
        universityDegree: "",
        address: form.address,
        phone: form.phone,
        landline: form.landline,
        termInterest: sem!.titleFa,
        levelInterest: sem!.level,
        selectedTeacherId: form.selectedTeacherId || undefined,
        selectedBookId: form.selectedBookId || undefined,
        note: form.note,
        agreedToTerms: form.agreedToTerms,
      });
      setSubmitting(false);
      const chosenBook = form.selectedBookId ? books.find(b => b.id === form.selectedBookId) : null;
      toast.success("فرم ثبت‌نام ثبت شد. لطفاً پرداخت را تکمیل کنید.");
      nav("/register/pay", {
        state: {
          registrationId: (created as any)?.id,
          registrantName: form.fullName,
          phone: form.phone,
          semester: { id: sem!.id, titleFa: sem!.titleFa, priceToman: sem!.priceToman },
          book: chosenBook ? { id: chosenBook.id, titleFa: chosenBook.titleFa, priceToman: chosenBook.priceToman, coverUrl: chosenBook.coverUrl } : null,
        },
      });
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
          <p className="text-muted-foreground text-sm">
            تکمیل فرم و پرداخت شهریه از طریق درگاه امن زرین‌پال، برای قطعی شدن ثبت‌نام الزامی است.
          </p>
        </div>

        <form onSubmit={submit} className="bg-card p-8 md:p-10 rounded-3xl border border-primary/10 shadow-soft space-y-8">
          <p className="text-primary leading-8 text-sm md:text-base">
            احتراماً اینجانب <b>(زبان‌آموز)</b> اطلاعات زیر را جهت ثبت‌نام در آموزشگاه زبان گویا اعلام می‌نمایم.
          </p>

          {/* Semester — required */}
          <fieldset className="space-y-3">
            <legend className="text-lg font-black text-primary mb-2">انتخاب ترم *</legend>
            <F label="ترم مورد نظر *">
              <select
                value={form.semesterId}
                onChange={e => setForm({ ...form, semesterId: e.target.value, selectedTeacherId: "", selectedBookId: "" })}
                className={inputCls}
                required
              >
                <option value="">— لطفاً یک ترم را انتخاب کنید —</option>
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.titleFa} — {(s.priceToman || 0).toLocaleString("fa-IR")} تومان
                  </option>
                ))}
              </select>
            </F>
            <p className="text-xs text-turquoise bg-turquoise/10 border border-turquoise/30 rounded-xl p-3 leading-6">
              پس از ارسال فرم به درگاه پرداخت زرین‌پال منتقل می‌شوید. ثبت‌نام تنها با پرداخت شهریه قطعی می‌گردد.
            </p>
          </fieldset>

          {/* Personal info */}
          <fieldset className="space-y-4 pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-2 pt-4">مشخصات زبان‌آموز</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="نام و نام خانوادگی *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls} required /></F>
              <F label="نام پدر"><input value={form.fatherName} onChange={e => setForm({ ...form, fatherName: e.target.value })} className={inputCls} /></F>
              <F label="کد ملی *"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} className={inputCls} dir="ltr" required /></F>
              <F label="محل تولد"><input value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })} className={inputCls} placeholder="مثلاً گناباد" /></F>
              <F label="سال تولد *">
                <input value={form.birthYear} onChange={e => setForm({ ...form, birthYear: e.target.value.replace(/[^\d۰-۹]/g, "").slice(0, 4) })} className={inputCls} dir="ltr" inputMode="numeric" placeholder="مثلاً 1385" required />
              </F>
              <F label="پایه تحصیلی">
                <input value={form.eduLevel} onChange={e => setForm({ ...form, eduLevel: e.target.value })} className={inputCls} placeholder="مثلاً هشتم / دیپلم / کارشناسی" />
              </F>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-4 pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-2 pt-4">اطلاعات تماس</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <F label="تلفن ثابت"><input value={form.landline} onChange={e => setForm({ ...form, landline: e.target.value })} className={inputCls} dir="ltr" /></F>
              <F label="همراه *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} dir="ltr" required /></F>
              <div className="sm:col-span-2">
                <F label="آدرس *"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls + " min-h-20"} required /></F>
              </div>
            </div>
          </fieldset>

          {/* Teacher — required when semester chosen */}
          {sem && teacherChoices.length > 0 && (
            <fieldset className="space-y-3 pt-2 border-t border-primary/10">
              <legend className="text-lg font-black text-primary mb-2 pt-4">انتخاب استاد *</legend>
              <F label="استاد مورد نظر *">
                <select
                  value={form.selectedTeacherId}
                  onChange={e => setForm({ ...form, selectedTeacherId: e.target.value })}
                  className={inputCls}
                  required
                >
                  <option value="">— انتخاب کنید —</option>
                  {teacherChoices.map(x => <option key={x.id} value={x.id}>{x.nameFa}</option>)}
                </select>
              </F>
            </fieldset>
          )}

          {/* Optional book */}
          {sem && bookChoices.length > 0 && (
            <fieldset className="space-y-3 pt-2 border-t border-primary/10">
              <legend className="text-lg font-black text-primary mb-2 pt-4 flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-gold" /> کتاب دوره (اختیاری — ۵٪ تخفیف)
              </legend>
              <div className="bg-gold/10 border border-gold/40 rounded-2xl p-4">
                <p className="text-sm text-primary leading-7 mb-3">
                  با انتخاب کتاب و خرید آنلاین از همین سایت، <strong className="text-gold">۵٪ ارزان‌تر</strong> از حضوری خرید می‌کنید و کتاب پیش از شروع کلاس به دست شما می‌رسد.
                </p>
                <F label="کتاب پیشنهادی دوره">
                  <select value={form.selectedBookId} onChange={e => setForm({ ...form, selectedBookId: e.target.value })} className={inputCls}>
                    <option value="">— بدون انتخاب —</option>
                    {bookChoices.map(b => (
                      <option key={b.id} value={b.id}>
                        <BookOpen className="inline" /> {b.titleFa} — {formatToman(b.priceToman)}
                      </option>
                    ))}
                  </select>
                </F>
              </div>
            </fieldset>
          )}

          <F label="توضیحات (اختیاری)">
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls + " min-h-16"} />
          </F>

          {/* Terms */}
          <fieldset className="pt-2 border-t border-primary/10">
            <legend className="text-lg font-black text-primary mb-3 pt-4 flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-gold" /> مقررات ثبت‌نام
            </legend>
            <div className="bg-parchment/60 border border-primary/10 rounded-2xl p-5">
              <ol className="list-decimal pr-5 space-y-2 text-sm text-foreground/85 leading-7">
                {TERMS.map((t, i) => <li key={i}>{t}</li>)}
              </ol>
              <label className="flex items-start gap-3 mt-5 cursor-pointer">
                <input type="checkbox" checked={form.agreedToTerms} onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })} className="mt-1 h-5 w-5 accent-[hsl(var(--gold))]" />
                <span className="text-sm font-bold text-primary">مقررات فوق را مطالعه کرده و می‌پذیرم.</span>
              </label>
            </div>
          </fieldset>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <GraduationCap className="h-5 w-5" /> {submitting ? "در حال ارسال…" : "ادامه و پرداخت شهریه"}
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
