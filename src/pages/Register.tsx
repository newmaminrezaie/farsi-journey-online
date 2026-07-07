import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { registrationsApi } from "@/lib/api";
import { GraduationCap } from "lucide-react";

const LEVELS = [
  { v: "beginner", l: "مقدماتی" },
  { v: "intermediate", l: "متوسط" },
  { v: "advanced", l: "پیشرفته" },
  { v: "ielts", l: "آیلتس" },
];

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ fullName: "", phone: "", nationalId: "", levelInterest: "beginner", note: "" });
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error("نام و شماره تماس الزامی است");
    setSubmitting(true);
    await registrationsApi.create({
      semesterId: null,
      fullName: form.fullName, phone: form.phone, nationalId: form.nationalId,
      levelInterest: form.levelInterest as any, note: form.note,
    });
    setSubmitting(false);
    toast.success("درخواست شما ثبت شد. کارشناسان گویا به‌زودی تماس می‌گیرند.");
    nav("/");
  }

  return (
    <section className="relative py-20 bg-parchment overflow-hidden">
      <div className="absolute inset-0 tile-bg-gold opacity-40" />
      <div className="container relative max-w-2xl">
        <div className="text-center mb-10">
          <div className="chip-gold inline-flex mb-4">مشاوره رایگان</div>
          <h1 className="text-4xl md:text-5xl mb-3 text-primary">ثبت درخواست ثبت‌نام</h1>
          <p className="text-muted-foreground">فرم زیر را پر کنید تا مشاوران گویا بهترین دوره را به شما پیشنهاد دهند.</p>
        </div>
        <form onSubmit={submit} className="bg-card p-8 md:p-10 rounded-3xl border border-primary/10 shadow-soft space-y-4">
          <F label="نام و نام خانوادگی *"><input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className={inputCls} /></F>
          <div className="grid sm:grid-cols-2 gap-4">
            <F label="شماره تماس *"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} /></F>
            <F label="کد ملی"><input value={form.nationalId} onChange={e => setForm({ ...form, nationalId: e.target.value })} className={inputCls} /></F>
          </div>
          <F label="سطح مورد نظر">
            <select value={form.levelInterest} onChange={e => setForm({ ...form, levelInterest: e.target.value })} className={inputCls}>
              {LEVELS.map(l => <option key={l.v} value={l.v}>{l.l}</option>)}
            </select>
          </F>
          <F label="توضیحات">
            <textarea value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} className={inputCls + " min-h-28"} />
          </F>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            <GraduationCap className="h-5 w-5" /> {submitting ? "در حال ارسال…" : "ارسال درخواست"}
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
