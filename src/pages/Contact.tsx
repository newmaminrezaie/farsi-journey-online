import { MapPin, Phone, Clock, Send, Instagram, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FORM_ENDPOINT = "https://www.form-to-email.com/api/s/1mRAr60LwuoS";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("message", form.message);
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "X-AJAX": "true" },
        body: fd,
      });
      if (res.ok) {
        toast.success("پیام شما با موفقیت ارسال شد.");
        setForm({ name: "", email: "", message: "" });
      } else {
        toast.error("ارسال پیام ناموفق بود. لطفاً دوباره تلاش کنید.");
      }
    } catch {
      toast.error("ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.");
    } finally {
      setSubmitting(false);
    }
  }
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
          <Item icon={<Phone />} title="تلفن‌های ثابت">
            <div dir="ltr" className="space-y-0.5">
              <div>۰۵۱ ۵۷۲۲ ۳۷۷۲</div>
              <div>۰۵۱ ۵۷۲۲ ۲۰۷۷</div>
            </div>
          </Item>
          <Item icon={<Phone />} title="همراه"><span dir="ltr">۰۹۹۱ ۵۱۳ ۱۱۶۲</span></Item>
          <Item icon={<Instagram />} title="اینستاگرام">
            <a href="https://instagram.com/higooya" target="_blank" rel="noreferrer" className="text-primary hover:text-gold" dir="ltr">@higooya</a>
          </Item>
          <Item icon={<MessageCircle />} title="ایتا">
            <a href="https://eitaa.com/higooya" target="_blank" rel="noreferrer" className="text-primary hover:text-gold" dir="ltr">@higooya</a>
          </Item>
          <Item icon={<Clock />} title="ساعات کار">شنبه تا پنجشنبه، ۸ صبح تا ۹ شب</Item>
        </div>
        <form onSubmit={handleSubmit}
              className="bg-card rounded-3xl p-8 border border-primary/10 space-y-4">
          <h3 className="text-2xl text-primary mb-2">پیام سریع</h3>
          <input name="name" placeholder="نام" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                 maxLength={100}
                 className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3" required />
          <input name="email" type="email" placeholder="ایمیل" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                 maxLength={255} dir="ltr"
                 className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3" required />
          <textarea name="message" placeholder="پیام شما…" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                    maxLength={2000}
                    className="w-full rounded-xl bg-parchment border border-primary/15 px-4 py-3 min-h-32" required />
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            <Send className="h-4 w-4" /> {submitting ? "در حال ارسال…" : "ارسال پیام"}
          </button>
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
