import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-20 text-center max-w-2xl">
          <div className="chip-gold inline-flex mb-5">تماس با ما</div>
          <h1 className="text-4xl md:text-display leading-tight mb-4">
            <span className="text-gold gold-underline">در ارتباط</span> باشید
          </h1>
        </div>
      </section>

      <section className="container py-16 grid lg:grid-cols-2 gap-10">
        <div className="space-y-4">
          <Item icon={<MapPin />} title="نشانی">گناباد، خراسان رضوی، غفاری ۳ — آموزشگاه زبان‌های گویا</Item>
          <Item icon={<Phone />} title="تلفن">۰۵۷ ۵۷۲۲ ۰۰۰۰</Item>
          <Item icon={<Mail />} title="ایمیل">info@higooya.ir</Item>
          <Item icon={<Clock />} title="ساعات کار">شنبه تا پنجشنبه، ۸ صبح تا ۹ شب</Item>
        </div>
        <form onSubmit={e => { e.preventDefault(); toast.success("پیام شما ارسال شد."); setForm({ name: "", phone: "", message: "" }); }}
              className="bg-card rounded-3xl p-8 border border-primary/10 space-y-4">
          <h3 className="text-2xl text-primary mb-2">پیام سریع</h3>
          <input placeholder="نام" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                 className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3" required />
          <input placeholder="شماره تماس" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                 className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3" required />
          <textarea placeholder="پیام شما…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3 min-h-32" required />
          <button className="btn-primary w-full"><Send className="h-4 w-4" /> ارسال پیام</button>
        </form>
      </section>
    </>
  );
}

function Item({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-primary/10 flex gap-4">
      <div className="w-12 h-12 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="font-bold text-primary mb-1">{title}</div>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
