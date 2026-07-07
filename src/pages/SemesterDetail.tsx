import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { semestersApi, teachersApi, registrationsApi, formatToman } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { levelFa, modeFa } from "./Home";
import { Calendar, Clock, Users, GraduationCap, ArrowRight } from "lucide-react";

export default function SemesterDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: sem } = useQuery({ queryKey: ["semester", id], queryFn: () => semestersApi.get(id!), enabled: !!id });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });

  const [form, setForm] = useState({ fullName: "", phone: "", nationalId: "", note: "" });
  const [submitting, setSubmitting] = useState(false);

  if (!sem) return <div className="container py-40 text-center text-muted-foreground">در حال بارگذاری…</div>;
  const t = teachers.find(x => x.id === sem.teacherId);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.phone) return toast.error("نام و شماره تماس الزامی است");
    setSubmitting(true);
    await registrationsApi.create({
      semesterId: sem!.id,
      fullName: form.fullName, phone: form.phone, nationalId: form.nationalId,
      levelInterest: sem!.level, note: form.note,
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

        <aside className="bg-primary text-primary-foreground rounded-3xl p-8 h-fit sticky top-24 relative overflow-hidden">
          <div className="absolute inset-0 tile-bg-navy opacity-40" />
          <div className="relative">
            <div className="text-sm text-primary-foreground/70 mb-1">شهریه دوره</div>
            <div className="text-4xl font-black text-gold mb-6">{formatToman(sem.priceToman)}</div>
            <form onSubmit={submit} className="space-y-3">
              <Input placeholder="نام و نام خانوادگی" value={form.fullName} onChange={v => setForm({ ...form, fullName: v })} />
              <Input placeholder="شماره تماس" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
              <Input placeholder="کد ملی (اختیاری)" value={form.nationalId} onChange={v => setForm({ ...form, nationalId: v })} />
              <textarea placeholder="توضیحات (اختیاری)" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })}
                        className="w-full rounded-xl bg-parchment/10 border border-gold/25 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 min-h-24" />
              <button type="submit" disabled={submitting} className="btn-gold w-full mt-2">
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

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full rounded-xl bg-parchment/10 border border-gold/25 px-4 py-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-gold" />
  );
}
