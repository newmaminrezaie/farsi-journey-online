import { useQuery } from "@tanstack/react-query";
import { teachersApi } from "@/lib/api";

export default function Teachers() {
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-20 text-center max-w-2xl">
          <div className="chip-gold inline-flex mb-5">کادر آموزشی</div>
          <h1 className="text-4xl md:text-display leading-tight mb-4">
            اساتید <span className="text-gold gold-underline">گویا</span>
          </h1>
          <p className="text-primary-foreground/80">با تجربه، متعهد و مسلط به روش‌های نوین آموزش زبان.</p>
        </div>
      </section>

      <section className="container py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teachers.map(t => (
          <article key={t.id} className="bg-card rounded-3xl overflow-hidden border border-primary/10 hover:border-gold/40 hover:shadow-navy transition-all">
            <div className="warm-photo-overlay">
              <img src={t.photoUrl} alt={t.nameFa} className="w-full h-80 object-cover object-top warm-photo" />
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-3 flex-wrap">
                {t.specialties.map(s => <span key={s} className="chip">{s}</span>)}
              </div>
              <h3 className="text-2xl mb-2 text-primary">{t.nameFa}</h3>
              <p className="text-sm text-muted-foreground italic mb-3">{t.nameEn}</p>
              <p className="text-sm text-primary/80 leading-7">{t.bioFa}</p>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
