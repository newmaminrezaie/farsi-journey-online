import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { semestersApi, teachersApi, registrationsApi, formatToman } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { levelFa, modeFa } from "./Home";
import { Calendar, Clock, Users, GraduationCap, ArrowRight, ScrollText } from "lucide-react";

const TERMS = [
  "این مرکز تابع مقررات پوششی و رفتاری آموزش و پرورش است، لذا از نظر رفتار و پوشش و حجاب کاملاً همانند مدارس می‌باشد.",
  "تکمیل فرم ثبت‌نام و واریز شهریه به منزله ثبت‌نام قطعی تلقی شده و در صورت انصراف مبلغ شهریه استرداد نخواهد شد، مگر در مواردی که از طرف آموزشگاه تعطیل یا منحل گردد.",
  "غیبت بیش از ۴ جلسه موجه یا غیر موجه در طول ترم باعث محرومیت از امتحان و در نتیجه عدم دریافت گواهینامه می‌شود.",
  "آموزشگاه در خصوص رفت و برگشت شما به کلاس هیچ‌گونه مسئولیتی ندارد.",
];

export default function SemesterDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: sem } = useQuery({ queryKey: ["semester", id], queryFn: () => semestersApi.get(id!), enabled: !!id });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });

  const [form, setForm] = useState({
    fullName: "", fatherName: "", birthCertNo: "",
    issuedFrom: "", birthPlace: "",
    schoolDegree: "", universityDegree: "",
    address: "", landline: "", phone: "", nationalId: "",
    termInterest: "", levelInterest: "", selectedTeacherId: "",
    note: "", agreedToTerms: false,
  });
  const [submitting, setSubmitting] = useState(false);

  if (!sem) return <div className="container py-40 text-center text-muted-foreground">در حال بارگذاری…</div>;
  const assignedIds = (sem.teacherIds && sem.teacherIds.length ? sem.teacherIds : (sem.teacherId ? [sem.teacherId] : []));
  const assignedTeachers = teachers.filter(x => assignedIds.includes(x.id));
  const t = assignedTeachers[0] ?? teachers.find(x => x.id === sem.teacherId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error("نام زبان‌آموز و شماره همراه الزامی است");
    if (!form.agreedToTerms) return toast.error("لطفاً مقررات ثبت‌نام را تأیید کنید");
    setSubmitting(true);
    await registrationsApi.create({
      semesterId: sem!.id,
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
      termInterest: form.termInterest || sem!.titleFa,
      levelInterest: form.levelInterest || levelFa(sem!.level),
      note: form.note,
      agreedToTerms: form.agreedToTerms,
    });
    setSubmitting(false);
    toast.success("ثبت‌نام شما با موفقیت ثبت شد. به‌زودی با شما تماس می‌گیریم.");
    nav("/semesters");
  }

  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-16">
          <Link to="/semesters" className="inline-flex items-center gap-2 text-gold mb-6"><ArrowRight className="h-4 w-4" /> بازگشت</Link>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="chip-gold">{levelFa(sem.level)}</span>
            <span className="chip">{modeFa(sem.mode)}</span>
          </div>
          <h1 className="text-4xl md:text-6xl leading-tight mb-4">{sem.titleFa}</h1>
          <p className="text-primary-foreground/80">استاد: {t?.nameFa}</p>
        </div>
      </section>

      <section className="container py-16 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <InfoCard icon={<Calendar />} label="شروع" value={formatJalali(sem.startsOn)} />
            <InfoCard icon={<Calendar />} label="پایان" value={formatJalali(sem.endsOn)} />
            <InfoCard icon={<Users />} label="ظرفیت باقی‌مانده" value={(sem.capacity - sem.seatsTaken).toLocaleString("fa-IR") + " نفر"} />
          </div>
          <div className="bg-card rounded-3xl p-8 border border-primary/10">
            <h3 className="text-xl mb-4 text-primary flex items-center gap-2"><Clock className="h-5 w-5 text-gold" /> برنامه کلاس‌ها</h3>
            <p className="text-primary/80 leading-8">{sem.scheduleFa}</p>
          </div>
          {t && (
            <div className="bg-card rounded-3xl p-8 border border-primary/10 flex gap-6 items-center">
              <img src={t.photoUrl} alt={t.nameFa} className="w-24 h-24 rounded-2xl object-cover warm-photo" />
              <div>
                <div className="chip mb-2">استاد دوره</div>
                <h4 className="text-xl text-primary">{t.nameFa}</h4>
                <p className="text-sm text-muted-foreground mt-1">{t.bioFa}</p>
              </div>
            </div>
          )}
        </div>

        <aside className="bg-primary text-primary-foreground rounded-3xl p-6 h-fit sticky top-24 relative overflow-hidden">
          <div className="absolute inset-0 tile-bg-navy opacity-40" />
          <div className="relative">
            <div className="text-sm text-primary-foreground/70 mb-1">شهریه دوره</div>
            <div className="text-4xl font-black text-gold mb-5">{formatToman(sem.priceToman)}</div>
            <div className="chip-gold mb-4 inline-flex">فرم ثبت‌نام کامل</div>
            <form onSubmit={submit} className="space-y-5">
              <p className="text-sm text-primary-foreground/85 leading-7">
                احتراماً اینجانب اطلاعات زیر را جهت ثبت‌نام در این ترم اعلام می‌نمایم.
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
                <Input label="نام و نام خانوادگی *" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />
                <Input label="نام پدر" value={form.fatherName} onChange={v => setForm({ ...form, fatherName: v })} />
                <Input label="شماره شناسنامه" value={form.birthCertNo} onChange={v => setForm({ ...form, birthCertNo: v })} />
                <Input label="کد ملی" value={form.nationalId} onChange={v => setForm({ ...form, nationalId: v })} />
                <Input label="صادره از" value={form.issuedFrom} onChange={v => setForm({ ...form, issuedFrom: v })} />
                <Input label="متولد" value={form.birthPlace} onChange={v => setForm({ ...form, birthPlace: v })} placeholder="محل و سال تولد" />
                <Input label="مدرک تحصیلی — مدرسه" value={form.schoolDegree} onChange={v => setForm({ ...form, schoolDegree: v })} />
                <Input label="مدرک تحصیلی — دانشگاه" value={form.universityDegree} onChange={v => setForm({ ...form, universityDegree: v })} />
                <Input label="تلفن ثابت" value={form.landline} onChange={v => setForm({ ...form, landline: v })} dir="ltr" />
                <Input label="همراه *" value={form.phone} onChange={v => setForm({ ...form, phone: v })} dir="ltr" />
              </div>

              <label className="block">
                <span className="block text-xs font-bold text-gold mb-1.5">آدرس</span>
                <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={fieldCls + " min-h-20"} />
              </label>

              <div className="bg-parchment/10 border border-gold/25 rounded-2xl p-4 space-y-3">
                <p className="text-sm leading-8 text-primary-foreground/90">
                  مایل به شرکت در ترم
                  <input value={form.termInterest} onChange={e => setForm({ ...form, termInterest: e.target.value })} className={inlineCls} placeholder={sem.titleFa} />
                  سطح
                  <input value={form.levelInterest} onChange={e => setForm({ ...form, levelInterest: e.target.value })} className={inlineCls} placeholder={levelFa(sem.level)} />
                  می‌باشم.
                </p>
                <label className="block">
                  <span className="block text-xs font-bold text-gold mb-1.5">توضیحات</span>
                  <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={fieldCls + " min-h-16"} />
                </label>
              </div>

              <div className="bg-parchment/10 border border-gold/25 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-gold font-black mb-3"><ScrollText className="h-5 w-5" /> مقررات ثبت‌نام</div>
                <ol className="list-decimal pr-5 space-y-2 text-xs leading-6 text-primary-foreground/85">
                  {TERMS.map((term, i) => <li key={i}>{term}</li>)}
                </ol>
                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input type="checkbox" checked={form.agreedToTerms} onChange={e => setForm({ ...form, agreedToTerms: e.target.checked })} className="mt-1 h-5 w-5 accent-[hsl(var(--gold))]" />
                  <span className="text-sm font-bold text-primary-foreground">مقررات فوق را مطالعه کرده و می‌پذیرم.</span>
                </label>
              </div>

              <button type="submit" disabled={submitting} className="btn-gold w-full">
                <GraduationCap className="h-5 w-5" /> {submitting ? "در حال ثبت…" : "ثبت‌نام در این ترم"}
              </button>
            </form>
          </div>
        </aside>
      </section>
    </>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-primary/10 text-center">
      <div className="w-10 h-10 rounded-full bg-gold/15 text-gold mx-auto mb-3 flex items-center justify-center">{icon}</div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-bold text-primary">{value}</div>
    </div>
  );
}

const fieldCls = "w-full rounded-xl bg-parchment/10 border border-gold/25 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-gold";
const inlineCls = "inline-block mx-2 my-1 rounded-lg bg-parchment/10 border border-gold/25 px-3 py-1 text-sm text-primary-foreground placeholder:text-primary-foreground/45 focus:outline-none focus:border-gold min-w-28 max-w-full";

function Input({ label, placeholder, value, onChange, dir }: { label: string; placeholder?: string; value: string; onChange: (v: string) => void; dir?: "rtl" | "ltr" }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-gold mb-1.5">{label}</span>
      <input dir={dir} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={fieldCls} />
    </label>
  );
}
