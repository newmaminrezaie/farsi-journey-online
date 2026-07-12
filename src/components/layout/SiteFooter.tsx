import { Link } from "react-router-dom";
import { MapPin, Phone, Clock, Instagram, MessageCircle } from "lucide-react";
import logo from "@/assets/logo-en.png";

export default function SiteFooter() {
  return (
    <footer className="mt-24 bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 tile-bg-navy opacity-40 pointer-events-none" />
      <div className="container relative py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <img src={logo} alt="HiGooya" className="h-16 w-auto bg-parchment rounded-xl p-2 mb-5" />
          <p className="text-primary-foreground/80 leading-8 max-w-md">
            آموزشگاه زبان‌های خارجی گویا، مرجعی معتبر برای آموزش انگلیسی، مکالمه و آیلتس در گناباد. حضوری و آنلاین.
          </p>
          <div className="flex gap-3 mt-6">
            <a href="https://instagram.com/higooya" target="_blank" rel="noreferrer" title="اینستاگرام @higooya" className="p-3 rounded-full bg-gold/20 hover:bg-gold hover:text-primary transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="https://eitaa.com/mygooya" target="_blank" rel="noreferrer" title="ایتا @mygooya" className="p-3 rounded-full bg-gold/20 hover:bg-gold hover:text-primary transition-colors"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="text-gold mb-4 text-lg">دسترسی سریع</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/85">
            <li><Link to="/semesters" className="hover:text-gold">ترم‌های جاری</Link></li>
            <li><Link to="/teachers" className="hover:text-gold">اساتید</Link></li>
            <li><Link to="/shop" className="hover:text-gold">کتاب‌ها</Link></li>
            <li><Link to="/register" className="hover:text-gold">ثبت‌نام</Link></li>
            <li><Link to="/about" className="hover:text-gold">درباره ما</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-gold mb-4 text-lg">تماس با ما</h4>
          <ul className="space-y-3 text-sm text-primary-foreground/85">
            <li className="flex gap-2"><MapPin className="h-4 w-4 mt-1 shrink-0 text-gold" /> گناباد، خراسان رضوی، غفاری ۳</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-1 shrink-0 text-gold" /> <span dir="ltr">۰۵۱ ۵۷۲۲ ۳۷۷۲</span></li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-1 shrink-0 text-gold" /> <span dir="ltr">۰۵۱ ۵۷۲۲ ۲۰۷۷</span></li>
            <li className="flex gap-2"><Phone className="h-4 w-4 mt-1 shrink-0 text-gold" /> <span dir="ltr">۰۹۹۱ ۵۱۳ ۱۱۶۲</span></li>
            <li className="flex gap-2"><Instagram className="h-4 w-4 mt-1 shrink-0 text-gold" /> <a href="https://instagram.com/higooya" target="_blank" rel="noreferrer" dir="ltr" className="hover:text-gold">@higooya</a></li>
            <li className="flex gap-2"><MessageCircle className="h-4 w-4 mt-1 shrink-0 text-gold" /> <a href="https://eitaa.com/mygooya" target="_blank" rel="noreferrer" dir="ltr" className="hover:text-gold">@mygooya</a> <span className="text-primary-foreground/60">(ایتا)</span></li>
            <li className="flex gap-2"><Clock className="h-4 w-4 mt-1 shrink-0 text-gold" /> شنبه تا پنجشنبه، ۸ صبح تا ۹ شب</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 relative">
        <div className="container py-5 text-center text-xs text-primary-foreground/60">
          © ۱۴۰۳ آموزشگاه زبان‌های گویا — تمامی حقوق محفوظ است.
        </div>
      </div>
    </footer>
  );
}
