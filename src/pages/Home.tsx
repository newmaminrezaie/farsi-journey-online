import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, GraduationCap, BookOpen, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { semestersApi, teachersApi, booksApi, formatToman } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { TileStar, TileHex } from "@/components/PersianPattern";
import logoFa from "@/assets/logo-fa.png";
import { localImages } from "@/assets/local";

export default function Home() {
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters", "open"], queryFn: () => semestersApi.listOpen() });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const { data: books = [] } = useQuery({ queryKey: ["books", "active"], queryFn: () => booksApi.listActive() });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-grad-hero text-primary-foreground">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <TileStar className="absolute -top-16 -left-16 w-96 text-gold/20" />
        <TileHex className="absolute -bottom-24 -right-24 w-[28rem] text-gold/15" />

        <div className="container relative py-20 md:py-28 grid md:grid-cols-5 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="md:col-span-3">
            <div className="chip-gold mb-6 inline-flex">
              <Sparkles className="h-3 w-3" /> از سال ۱۳۹۰ در گناباد
            </div>
            <h1 className="text-4xl md:text-display lg:text-display-lg leading-[1.05] mb-6">
              زبان انگلیسی را <br />
              <span className="text-gold">با استادان مجرب</span> بیاموزید
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/85 leading-9 max-w-2xl mb-10">
              آموزشگاه زبان‌های گویا، مرجعی معتبر برای آموزش تخصصی زبان‌های خارجی
              — از سطح مقدماتی تا آماده‌سازی آیلتس آکادمیک. حضوری و آنلاین.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/semesters" className="btn-gold">
                <GraduationCap className="h-5 w-5" /> ثبت‌نام در ترم جدید
              </Link>
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-full border-2 border-gold/60 px-7 py-3.5 font-bold text-gold hover:bg-gold hover:text-primary transition-colors">
                <BookOpen className="h-5 w-5" /> فروشگاه کتاب
              </Link>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg">
              {[
                { n: "۱۴+", l: "سال تجربه" },
                { n: "۲٬۵۰۰+", l: "زبان‌آموز" },
                { n: "۱۲", l: "استاد متخصص" },
              ].map(s => (
                <div key={s.l} className="text-center border-r border-gold/25 pr-4 first:border-r-0 first:pr-0">
                  <div className="text-3xl md:text-4xl font-black text-gold">{s.n}</div>
                  <div className="text-xs md:text-sm text-primary-foreground/70 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, delay: 0.15 }}
            className="md:col-span-2 relative">
            <div className="warm-photo-overlay warm-photo rounded-3xl">
              <img src={localImages.heroClass}
                   alt="کلاس زبان" className="w-full h-[420px] object-cover" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-parchment text-primary rounded-2xl p-4 shadow-navy flex items-center gap-3">
              <img src={logoFa} alt="گویا" className="h-12 w-12 object-contain" />
              <div>
                <div className="text-xs text-muted-foreground">آموزشگاه زبان</div>
                <div className="font-black">HiGooya Academy</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ACTIVE SEMESTERS */}
      <section className="container py-20">
        <SectionHeader eyebrow="ترم‌های جاری" title="در حال ثبت‌نام" note="از میان دوره‌های زیر مناسب‌ترین را انتخاب کنید" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {semesters.slice(0, 6).map((s, i) => {
            const teacherIds = s.teacherIds?.length ? s.teacherIds : ((s as any).teacherId ? [(s as any).teacherId] : []);
            const teacherNames = teacherIds.map(id => teachers.find(t => t.id === id)?.nameFa).filter(Boolean).join("، ");
            return (
              <motion.article
                key={s.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }}
                className="group relative bg-card rounded-3xl p-6 border border-primary/10 hover:border-gold/40 hover:shadow-navy transition-all">
                <div className="flex items-start justify-between mb-4">
                  <span className="chip">{modeFa(s.mode)}</span>
                  <span className="chip-gold">{levelFa(s.level)}</span>
                </div>
                <h3 className="text-xl mb-3 text-primary">{s.titleFa}</h3>
                <p className="text-sm text-muted-foreground mb-4 leading-7">{s.scheduleFa}</p>
                <div className="text-xs text-muted-foreground mb-5">
                  {formatJalali(s.startsOn)} <span className="mx-1">–</span> {formatJalali(s.endsOn)}
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-primary/10">
                  <div>
                    <div className="text-lg font-black text-primary">{formatToman(s.priceToman)}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{teacherNames}</div>
                  </div>
                  <Link to={`/semesters/${s.id}`} className="p-3 rounded-full bg-primary text-primary-foreground group-hover:bg-gold group-hover:text-gold-foreground transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-60" />
        <div className="container relative py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="chip-gold mb-6 inline-flex">چرا گویا؟</div>
            <h2 className="text-4xl md:text-5xl mb-6 leading-tight">
              روش تدریسی که <span className="text-gold gold-underline">جواب می‌دهد</span>
            </h2>
            <p className="text-primary-foreground/85 leading-8 mb-8">
              گروه‌های کوچک، بازخورد شخصی، منابع به‌روز و اساتیدی که هر روز با
              یادگیرندگان زندگی می‌کنند — نه تدریس صنعتی، بلکه پرورش زبان.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                "کلاس‌های حداکثر ۱۲ نفره",
                "پشتیبانی آنلاین بین کلاس‌ها",
                "منابع کمبریج و آکسفورد",
                "دوره‌های تخصصی آیلتس",
                "مکالمه هفتگی با استاد",
                "امتحانات هوشمند و بازخورد",
              ].map(f => (
                <li key={f} className="flex gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gold shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src={localImages.classReading}
                 className="warm-photo rounded-2xl h-64 object-cover" alt="" />
            <img src={localImages.classTeacher}
                 className="warm-photo rounded-2xl h-64 object-cover mt-10" alt="" />
            <img src={localImages.classKids}
                 className="warm-photo rounded-2xl h-64 object-cover -mt-6" alt="" />
            <img src={localImages.library}
                 className="warm-photo rounded-2xl h-64 object-cover" alt="" />
          </div>
        </div>
      </section>

      {/* TEACHERS */}
      <section className="container py-20">
        <SectionHeader eyebrow="کادر آموزشی" title="اساتید ما" note="با تجربه، متعهد و مسلط به روش‌های نوین" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {teachers.slice(0, 4).map(t => (
            <div key={t.id} className="group text-center">
              <div className="relative mb-4 overflow-hidden rounded-3xl warm-photo-overlay">
                <img src={t.photoUrl} alt={t.nameFa} className="w-full h-72 object-cover object-top warm-photo" />
                <div className="absolute bottom-3 right-3 chip-gold">{t.specialties[0]}</div>
              </div>
              <h4 className="text-lg text-primary mb-1">{t.nameFa}</h4>
              <p className="text-xs text-muted-foreground leading-6 px-2">{t.bioFa}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/teachers" className="btn-ghost">مشاهده همه اساتید <ArrowLeft className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* BOOKS */}
      <section className="relative bg-parchment">
        <div className="absolute inset-0 tile-bg-gold opacity-50" />
        <div className="container relative py-20">
          <SectionHeader eyebrow="فروشگاه کتاب" title="کتاب‌هایی که با آن‌ها یاد می‌گیریم" note="کتاب‌های اصلی و کاربردی برای هر سطح" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {books.slice(0, 6).map(b => (
              <Link key={b.id} to={`/shop/${b.id}`} className="group">
                <div className="overflow-hidden rounded-2xl mb-3 warm-photo-overlay">
                  <img src={b.coverUrl} alt={b.titleFa} className="w-full h-56 object-cover warm-photo group-hover:scale-105 transition-transform duration-500" />
                </div>
                <h5 className="text-sm text-primary line-clamp-2 mb-1">{b.titleFa}</h5>
                <div className="text-xs font-bold text-gold">{formatToman(b.priceToman)}</div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/shop" className="btn-primary">مشاهده فروشگاه کتاب <ArrowLeft className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />


      {/* CTA */}
      <section className="container py-20">
        <div className="relative overflow-hidden rounded-[2rem] bg-grad-hero text-primary-foreground p-10 md:p-16 text-center">
          <div className="absolute inset-0 tile-bg-navy opacity-60" />
          <TileStar className="absolute -top-6 -right-6 w-40 text-gold/25" />
          <div className="relative max-w-2xl mx-auto">
            <Users className="h-10 w-10 mx-auto mb-4 text-gold" />
            <h2 className="text-3xl md:text-5xl mb-5">آماده‌ی شروع یادگیری هستید؟</h2>
            <p className="text-primary-foreground/85 mb-8 leading-8">
              فرم مشاوره رایگان را پر کنید تا کارشناسان گویا با شما تماس بگیرند و بهترین دوره را پیشنهاد دهند.
            </p>
            <Link to="/register" className="btn-gold">درخواست مشاوره رایگان</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeader({ eyebrow, title, note }: { eyebrow: string; title: string; note: string }) {
  return (
    <div className="mb-12 text-center max-w-2xl mx-auto">
      <div className="chip-gold inline-flex mb-4">{eyebrow}</div>
      <h2 className="text-4xl md:text-5xl mb-3 text-primary">{title}</h2>
      <p className="text-muted-foreground">{note}</p>
    </div>
  );
}

export function levelFa(l: string): string {
  const map: Record<string, string> = {
    beginner: "مقدماتی", elementary: "پایه", "pre-intermediate": "پیش‌متوسط",
    intermediate: "متوسط", "upper-intermediate": "فرا‌متوسط", advanced: "پیشرفته", ielts: "آیلتس",
  };
  return map[l] ?? l;
}
export function modeFa(m: string): string {
  return ({ "in-person": "حضوری", online: "آنلاین", hybrid: "ترکیبی" } as any)[m] ?? m;
}
