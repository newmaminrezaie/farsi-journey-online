import { TileHex } from "@/components/PersianPattern";
import { CheckCircle2 } from "lucide-react";

export default function About() {
  return (
    <>
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <TileHex className="absolute -bottom-16 -left-16 w-96 text-gold/20" />
        <div className="container relative py-20 md:py-28 max-w-3xl">
          <div className="chip-gold inline-flex mb-5">درباره ما</div>
          <h1 className="text-4xl md:text-display leading-tight mb-6">
            دو دهه <span className="text-gold gold-underline">آموزش زبان</span> در قلب گناباد
          </h1>
          <p className="text-lg text-primary-foreground/85 leading-9">
            آموزشگاه زبان‌های گویا از سال ۱۳۹۰ فعالیت خود را با هدف ارائه آموزش
            استاندارد و اثربخش زبان‌های خارجی آغاز کرد و امروز به یکی از معتبرترین
            مراکز آموزش زبان در خراسان رضوی تبدیل شده است.
          </p>
        </div>
      </section>

      <section className="container py-20 grid md:grid-cols-2 gap-12">
        <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"
             className="warm-photo rounded-3xl h-[500px] object-cover w-full" alt="" />
        <div>
          <h2 className="text-4xl mb-6 text-primary">فلسفه آموزشی</h2>
          <p className="text-muted-foreground leading-8 mb-6">
            ما باور داریم زبان صرفاً یک ابزار ارتباطی نیست، بلکه دریچه‌ای‌ست به سوی
            فرهنگ‌ها، ادبیات و شیوه‌های تازه اندیشیدن. به همین دلیل در گویا،
            یادگیری زبان با احترام به هویت فرهنگی و توانمندسازی زبان‌آموز همراه است.
          </p>
          <ul className="space-y-3">
            {[
              "کلاس‌های کوچک با تعامل بالا",
              "منابع اصلی کمبریج و آکسفورد",
              "اساتید با مدرک TESOL و CELTA",
              "بازخورد فردی و مشاوره یادگیری",
              "آماده‌سازی تخصصی آیلتس آکادمیک",
              "پلتفرم آنلاین برای دسترسی همیشگی به کلاس‌ها",
            ].map(f => (
              <li key={f} className="flex gap-3 items-start">
                <CheckCircle2 className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                <span className="text-primary/90">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-parchment relative">
        <div className="absolute inset-0 tile-bg-gold opacity-50" />
        <div className="container relative py-20 text-center">
          <h2 className="text-4xl mb-12 text-primary">در یک نگاه</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { n: "۱۴+", l: "سال فعالیت" },
              { n: "۲٬۵۰۰+", l: "دانش‌آموخته" },
              { n: "۱۲", l: "استاد" },
              { n: "۹۵٪", l: "رضایت زبان‌آموزان" },
            ].map(s => (
              <div key={s.l} className="bg-card rounded-3xl p-8 border border-gold/30 shadow-soft">
                <div className="text-5xl font-black text-primary mb-2">{s.n}</div>
                <div className="text-sm text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
