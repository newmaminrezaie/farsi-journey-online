import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { booksApi, formatToman } from "@/lib/api";
import { levelFa } from "./Home";
import { Search } from "lucide-react";

const CATS = [
  { v: "", l: "همه" },
  { v: "grammar", l: "گرامر" },
  { v: "vocabulary", l: "واژگان" },
  { v: "ielts", l: "آیلتس" },
  { v: "story", l: "داستان" },
  { v: "kids", l: "کودکان" },
  { v: "reference", l: "مرجع" },
];

export default function Shop() {
  const { data: books = [] } = useQuery({ queryKey: ["books", "active"], queryFn: () => booksApi.listActive() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const filtered = books.filter(b =>
    (!cat || b.category === cat) &&
    (!q || (b.titleFa + " " + (b.titleEn ?? "") + " " + b.author).toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-20 text-center max-w-3xl">
          <div className="chip-gold inline-flex mb-5">فروشگاه کتاب</div>
          <h1 className="text-4xl md:text-display leading-tight mb-4">
            منابع <span className="text-gold gold-underline">آموزشی</span>
          </h1>
          <p className="text-primary-foreground/80">کتاب‌های اصلی و کاربردی، ارسال به سراسر کشور.</p>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex flex-col md:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجو در کتاب‌ها…"
              className="w-full rounded-full bg-card border border-primary/10 pr-10 pl-4 py-3 focus:outline-none focus:border-gold" />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button key={c.v} onClick={() => setCat(c.v)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                  cat === c.v ? "bg-primary text-primary-foreground" : "bg-card text-primary border border-primary/10 hover:bg-gold/15"}`}>
                {c.l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map(b => (
            <Link key={b.id} to={`/shop/${b.id}`} className="group bg-card rounded-3xl overflow-hidden border border-primary/10 hover:border-gold/40 hover:shadow-navy transition-all">
              <div className="warm-photo-overlay overflow-hidden">
                <img src={b.coverUrl} alt={b.titleFa} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-4">
                <span className="chip-gold text-[10px] mb-2">{levelFa(b.level)}</span>
                <h3 className="text-base text-primary line-clamp-2 mb-1">{b.titleFa}</h3>
                <p className="text-xs text-muted-foreground mb-3">{b.author}</p>
                <div className="text-lg font-black text-gold">{formatToman(b.priceToman)}</div>
              </div>
            </Link>
          ))}
        </div>
        {filtered.length === 0 && <div className="text-center py-20 text-muted-foreground">کتابی یافت نشد.</div>}
      </section>
    </>
  );
}
