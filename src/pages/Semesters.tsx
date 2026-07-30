import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { semestersApi, teachersApi, formatToman } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import { levelFa, modeFa } from "./Home";
import { ArrowLeft, Users, Calendar, Clock } from "lucide-react";
import RelatedLinks from "@/components/RelatedLinks";
import { LEVELS } from "@/lib/levels";


const MODES: Array<{ id: "all" | "in-person" | "online" | "hybrid"; label: string }> = [
  { id: "all", label: "همه" },
  { id: "in-person", label: "حضوری" },
  { id: "online", label: "آنلاین" },
  { id: "hybrid", label: "ترکیبی" },
];

export default function Semesters() {
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: () => semestersApi.list() });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const [mode, setMode] = useState<"all" | "in-person" | "online" | "hybrid">("all");
  const [level, setLevel] = useState<string>("all");
  const filtered = semesters
    .filter(s => mode === "all" || s.mode === mode)
    .filter(s => level === "all" || s.level === level);

  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-20 text-center max-w-3xl">
          <div className="chip-gold inline-flex mb-5">کلاس‌ها</div>
          <h1 className="text-4xl md:text-display leading-tight mb-4">
            دوره‌های <span className="text-gold gold-underline">در حال ثبت‌نام</span>
          </h1>
          <p className="text-primary-foreground/80 leading-8">
            سطح خود را انتخاب کنید و در دوره‌ای که با برنامه شما هماهنگ است ثبت‌نام کنید.
          </p>
        </div>
      </section>

      <section className="container py-16">
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-5 py-2 rounded-full text-sm font-bold border transition-colors ${
                mode === m.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-primary border-primary/15 hover:border-gold/60"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => setLevel("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              level === "all" ? "bg-gold text-gold-foreground border-gold" : "bg-card text-primary border-primary/15 hover:border-gold/60"
            }`}
          >
            همه سطوح
          </button>
          {LEVELS.map(l => (
            <button
              key={l.value}
              onClick={() => setLevel(l.value)}
              title={l.books}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                level === l.value ? "bg-gold text-gold-foreground border-gold" : "bg-card text-primary border-primary/15 hover:border-gold/60"
              }`}
            >
              {l.label}
              <span className="font-normal opacity-70"> — {l.books}</span>
            </button>
          ))}
        </div>

        <div className="grid gap-6">
        {filtered.map(s => {
          const ids = (s.teacherIds && s.teacherIds.length ? s.teacherIds : (s.teacherId ? [s.teacherId] : []));
          const names = ids.map(id => teachers.find(x => x.id === id)?.nameFa).filter(Boolean).join("، ");
          const capacity = s.capacity ?? 0;
          const taken = s.seatsTaken ?? 0;
          const full = taken >= capacity && capacity > 0;
          return (
            <article key={s.id} className="bg-card rounded-3xl p-6 md:p-8 border border-primary/10 hover:shadow-navy transition-shadow grid md:grid-cols-[1fr_auto] gap-6 items-center">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.classCode && <span className="chip font-mono text-turquoise">{s.classCode}</span>}
                  <span className="chip">{modeFa(s.mode)}</span>
                  <span className="chip-gold">{levelFa(s.level)}</span>
                  {s.status === "open" && !full && <span className="chip">ثبت‌نام باز</span>}
                  {full && <span className="chip" style={{ background: "hsl(var(--destructive)/0.15)", color: "hsl(var(--destructive))" }}>تکمیل ظرفیت</span>}
                </div>
                <h3 className="text-2xl mb-2 text-primary">{s.titleFa}</h3>
                <p className="text-muted-foreground mb-4">استاد: {names || "—"}</p>
                <div className="grid sm:grid-cols-3 gap-4 text-sm text-primary/80">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gold" /> {formatJalali(s.startsOn)}</div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-gold" /> {s.scheduleFa || "—"}</div>
                  <div className="flex items-center gap-2"><Users className="h-4 w-4 text-gold" /> {Math.max(0, capacity - taken).toLocaleString("fa-IR")} صندلی خالی</div>
                </div>
              </div>
              <div className="text-center md:text-left border-t md:border-t-0 md:border-r md:pr-8 border-primary/10 pt-4 md:pt-0">
                <div className="text-3xl font-black text-primary mb-3">{formatToman(s.priceToman ?? 0)}</div>
                <Link to={`/semesters/${s.id}`} className="btn-primary">
                  جزئیات و ثبت‌نام <ArrowLeft className="h-4 w-4" />
                </Link>
              </div>
            </article>
          );
        })}
        </div>
      </section>
      <RelatedLinks
        title="گام بعدی شما"
        links={[
          { to: "/assessment", label: "تعیین سطح رایگان قبل از ثبت‌نام", desc: "با تعیین سطح آنلاین، بهترین کلاس را انتخاب کنید." },
          { to: "/register", label: "ثبت‌نام سریع در کلاس زبان", desc: "فرم ثبت‌نام و پرداخت آنلاین شهریه از طریق زرین‌پال." },
          { to: "/teachers", label: "اساتید و کارکنان گویا", desc: "کادر آموزشی مجرب دوره‌های حضوری و آنلاین." },
          { to: "/shop", label: "کتاب‌های کلاسی زبان", desc: "کتاب‌های اصلی هر دوره را با ۵٪ تخفیف تهیه کنید." },
        ]}
      />
    </>
  );
}
