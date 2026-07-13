import { useQuery } from "@tanstack/react-query";
import { employeesApi, teachersApi } from "@/lib/api";

export default function Teachers() {
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => employeesApi.list() });
  const activeEmployees = employees.filter(e => e.active !== false);

  return (
    <>
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 tile-bg-navy opacity-70" />
        <div className="container relative py-20 text-center max-w-2xl">
          <div className="chip-gold inline-flex mb-5">کادر آموزشی و اداری</div>
          <h1 className="text-4xl md:text-display leading-tight mb-4">
            اساتید و کارکنان <span className="text-gold gold-underline">گویا</span>
          </h1>
          <p className="text-primary-foreground/80">با تجربه، متعهد و مسلط به روش‌های نوین آموزش زبان.</p>
        </div>
      </section>

      <section className="container py-16">
        <h2 className="text-2xl md:text-3xl text-primary mb-8 flex items-center gap-3">
          <span className="h-8 w-1 bg-gold rounded-full" /> اساتید
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
          {teachers.map(t => (
            <article key={t.id} className="bg-card rounded-3xl overflow-hidden border border-primary/10 hover:border-gold/40 hover:shadow-navy transition-all">
              <div className="warm-photo-overlay">
                <img src={t.photoUrl} alt={t.nameFa} className="w-full h-72 object-cover object-top warm-photo" />
              </div>
              <div className="p-6">
                <div className="flex gap-2 mb-3 flex-wrap">
                  {t.specialties.map(s => <span key={s} className="chip">{s}</span>)}
                </div>
                <h3 className="text-xl mb-1 text-primary">{t.nameFa}</h3>
                <p className="text-xs text-muted-foreground italic mb-3">{t.nameEn}</p>
                <p className="text-sm text-primary/80 leading-7">{t.bioFa}</p>
              </div>
            </article>
          ))}
        </div>

        {activeEmployees.length > 0 && (
          <>
            <h2 className="text-2xl md:text-3xl text-primary mt-20 mb-8 flex items-center gap-3">
              <span className="h-8 w-1 bg-turquoise rounded-full" /> کارکنان
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {activeEmployees.map(e => (
                <article key={e.id} className="bg-card/70 rounded-2xl overflow-hidden border border-primary/10 hover:border-turquoise/40 transition-all">
                  <div className="warm-photo-overlay">
                    <img
                      src={e.photoUrl || "/placeholder.svg"}
                      alt={e.nameFa}
                      className="w-full h-52 object-cover object-top warm-photo"
                    />
                  </div>
                  <div className="p-4">
                    {e.roleFa && <span className="chip text-xs mb-2 inline-block">{e.roleFa}</span>}
                    <h3 className="text-base text-primary font-bold">{e.nameFa}</h3>
                    {e.nameEn && <p className="text-[11px] text-muted-foreground italic mb-2">{e.nameEn}</p>}
                    {e.bioFa && <p className="text-xs text-primary/70 leading-6 line-clamp-3">{e.bioFa}</p>}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
