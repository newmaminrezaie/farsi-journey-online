import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Megaphone, Pin, ArrowLeft, CalendarDays } from "lucide-react";
import { announcementsApi } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { formatJalali } from "@/lib/jalali";

const KIND_FA: Record<Announcement["kind"], string> = {
  news: "خبر",
  important: "مهم",
  event: "رویداد",
};

export default function AnnouncementsSection() {
  const [rows, setRows] = useState<Announcement[]>([]);

  useEffect(() => {
    announcementsApi.listPublic().then(setRows).catch(() => setRows([]));
  }, []);

  if (!rows.length) return null;

  return (
    <section className="relative bg-primary text-primary-foreground overflow-hidden">
      <div className="absolute inset-0 tile-bg-navy opacity-50 pointer-events-none" />
      <div className="container relative py-16">
        <div className="flex items-center gap-3 mb-8">
          <span className="p-3 rounded-2xl bg-gold text-gold-foreground">
            <Megaphone className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-3xl text-primary-foreground">اطلاعیه‌ها</h2>
            <p className="text-sm text-primary-foreground/70 mt-1">تازه‌ترین خبرها و اطلاعیه‌های آموزشگاه زبان گویا</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rows.slice(0, 6).map((a, i) => (
            <motion.article
              key={a.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="relative rounded-3xl bg-parchment/95 text-foreground p-6 border border-gold/30 hover:shadow-gold transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={a.kind === "important" ? "chip-gold" : "chip"}>{KIND_FA[a.kind]}</span>
                {a.pinned && (
                  <span className="inline-flex items-center gap-1 text-xs text-gold">
                    <Pin className="h-3.5 w-3.5" /> سنجاق‌شده
                  </span>
                )}
              </div>
              <h3 className="text-lg text-primary mb-2 leading-8">{a.title}</h3>
              {a.body && (
                <p className="text-sm text-muted-foreground leading-8 whitespace-pre-line">{a.body}</p>
              )}
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-primary/10">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatJalali(a.createdAt)}
                </span>
                {a.linkHref && (
                  <Link to={a.linkHref} className="inline-flex items-center gap-1 text-sm text-primary hover:text-gold transition-colors">
                    {a.linkLabel || "بیشتر"} <ArrowLeft className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
