import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Eye, EyeOff, Sparkles } from "lucide-react";
import ImageInput from "@/components/ImageInput";

type PromoBanner = {
  enabled: boolean;
  version: number;
  delayMs: number;
  title: string;
  subtitle: string;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  accent: "gold" | "turquoise" | "navy";
};

const DEFAULTS: PromoBanner = {
  enabled: false, version: 1, delayMs: 3000,
  title: "ثبت‌نام دوره‌های تابستانی گویا",
  subtitle: "کلاس‌های ویژه تابستان با تخفیف زودهنگام. ظرفیت محدود!",
  badge: "تابستان ۱۴۰۵", ctaLabel: "ثبت‌نام کنید", ctaHref: "/register",
  imageUrl: "", accent: "gold",
};

export default function PromoAdmin() {
  const [cfg, setCfg] = useState<PromoBanner>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/promo-banner")
      .then(r => r.ok ? r.json() : DEFAULTS)
      .then((c: PromoBanner) => setCfg({ ...DEFAULTS, ...c }))
      .catch(() => setCfg(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/promo-banner", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cfg),
      });
      if (!res.ok) throw new Error();
      const saved: PromoBanner = await res.json();
      setCfg({ ...DEFAULTS, ...saved });
      toast.success("بنر ذخیره شد");
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally { setSaving(false); }
  }

  async function resetDismissals() {
    // Bump version by saving with same content — server auto-bumps on any content change;
    // to force reset without content change we call PUT with version+1 explicitly.
    setSaving(true);
    try {
      const bumped = { ...cfg, version: (cfg.version || 1) + 1 };
      const res = await fetch("/api/admin/settings/promo-banner", {
        method: "PUT", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bumped),
      });
      if (!res.ok) throw new Error();
      const saved: PromoBanner = await res.json();
      setCfg({ ...DEFAULTS, ...saved });
      toast.success("بنر برای همه بازدیدکنندگان دوباره نمایش داده می‌شود");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="p-8 flex items-center gap-2 text-primary"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری…</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="chip-gold inline-flex mb-2"><Sparkles className="h-3 w-3" /> بنر تبلیغاتی</div>
          <h1 className="text-3xl font-black text-primary">بنر ثبت‌نام تابستانی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            این پنجره پس از ورود کاربر به سایت (با تأخیر قابل تنظیم) نمایش داده می‌شود.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCfg({ ...cfg, enabled: !cfg.enabled })}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border-2 transition-colors ${
              cfg.enabled ? "bg-turquoise text-white border-turquoise" : "bg-white text-primary border-primary/20"
            }`}
          >
            {cfg.enabled ? <><Eye className="h-4 w-4" /> فعال</> : <><EyeOff className="h-4 w-4" /> غیرفعال</>}
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره
          </button>
        </div>
      </header>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Form */}
        <section className="bg-card rounded-3xl p-6 border border-primary/10 space-y-4">
          <Field label="برچسب کوچک (Badge)">
            <input value={cfg.badge} onChange={e => setCfg({ ...cfg, badge: e.target.value })} className={input} />
          </Field>
          <Field label="عنوان اصلی">
            <input value={cfg.title} onChange={e => setCfg({ ...cfg, title: e.target.value })} className={input} />
          </Field>
          <Field label="متن توضیح">
            <textarea rows={3} value={cfg.subtitle} onChange={e => setCfg({ ...cfg, subtitle: e.target.value })} className={input} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="متن دکمه"><input value={cfg.ctaLabel} onChange={e => setCfg({ ...cfg, ctaLabel: e.target.value })} className={input} /></Field>
            <Field label="لینک دکمه"><input dir="ltr" value={cfg.ctaHref} onChange={e => setCfg({ ...cfg, ctaHref: e.target.value })} className={input} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="تأخیر نمایش (میلی‌ثانیه)">
              <input type="number" min={0} max={60000} step={500} value={cfg.delayMs}
                onChange={e => setCfg({ ...cfg, delayMs: Number(e.target.value) || 0 })} className={input} />
            </Field>
            <Field label="رنگ تأکید">
              <select value={cfg.accent} onChange={e => setCfg({ ...cfg, accent: e.target.value as any })} className={input}>
                <option value="gold">طلایی</option>
                <option value="turquoise">فیروزه‌ای</option>
                <option value="navy">سرمه‌ای</option>
              </select>
            </Field>
          </div>
          <Field label="تصویر بنر (اختیاری)">
            <ImageInput value={cfg.imageUrl} onChange={url => setCfg({ ...cfg, imageUrl: url })} />
          </Field>

          <div className="pt-2 border-t border-primary/10">
            <button onClick={resetDismissals} disabled={saving}
              className="text-xs font-bold text-primary/70 hover:text-primary underline">
              نمایش مجدد برای کاربرانی که بسته‌اند
            </button>
            <p className="text-[11px] text-muted-foreground mt-1">
              نسخهٔ فعلی بنر: <b>{cfg.version}</b> — با تغییر محتوا به‌طور خودکار افزایش می‌یابد.
            </p>
          </div>
        </section>

        {/* Preview */}
        <section className="bg-primary rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 tile-bg-navy opacity-40" />
          <div className="relative">
            <div className="text-xs font-bold text-gold mb-3">پیش‌نمایش زنده</div>
            <MiniPreview cfg={cfg} />
          </div>
        </section>
      </div>
    </div>
  );
}

const input = "w-full rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold text-primary/80 mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function MiniPreview({ cfg }: { cfg: PromoBanner }) {
  const accentChip =
    cfg.accent === "turquoise" ? "bg-turquoise/15 text-turquoise" :
    cfg.accent === "navy" ? "bg-primary/10 text-primary" : "bg-gold/15 text-gold";
  const accentBtn =
    cfg.accent === "turquoise" ? "bg-turquoise text-white" :
    cfg.accent === "navy" ? "bg-primary text-primary-foreground" : "bg-gold text-gold-foreground";
  return (
    <div className="rounded-2xl bg-parchment overflow-hidden shadow-navy">
      <div className="grid grid-cols-5">
        <div className="col-span-2 h-40 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 tile-bg-navy opacity-60" />
          {cfg.imageUrl && <img src={cfg.imageUrl} alt="" className="relative w-full h-full object-cover opacity-90" />}
        </div>
        <div className="col-span-3 p-5">
          {cfg.badge && <div className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold mb-2 ${accentChip}`}>{cfg.badge}</div>}
          <div className="text-lg font-black text-primary leading-snug">{cfg.title}</div>
          <div className="text-xs text-primary/70 leading-6 mt-1 line-clamp-3">{cfg.subtitle}</div>
          <div className={`inline-flex mt-3 rounded-full px-4 py-2 text-xs font-bold ${accentBtn}`}>{cfg.ctaLabel}</div>
        </div>
      </div>
    </div>
  );
}
