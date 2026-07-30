import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Images, Loader2, Save, Trash2 } from "lucide-react";
import ImageInput from "@/components/ImageInput";

type Slide = { imageUrl: string; alt: string };
type Cfg = { intervalMs: number; slides: Slide[] };

const EMPTY_SLIDE: Slide = { imageUrl: "", alt: "" };
const DEFAULTS: Cfg = { intervalMs: 6000, slides: [EMPTY_SLIDE, EMPTY_SLIDE, EMPTY_SLIDE] };

function pad(slides: Slide[]): Slide[] {
  const out = [...slides];
  while (out.length < 3) out.push({ ...EMPTY_SLIDE });
  return out.slice(0, 3);
}

export default function HeroAdmin() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/hero")
      .then(r => (r.ok ? r.json() : DEFAULTS))
      .then((c: Cfg) => setCfg({ intervalMs: c.intervalMs || 6000, slides: pad(c.slides || []) }))
      .catch(() => setCfg(DEFAULTS))
      .finally(() => setLoading(false));
  }, []);

  function setSlide(i: number, patch: Partial<Slide>) {
    setCfg(c => ({ ...c, slides: c.slides.map((s, k) => (k === i ? { ...s, ...patch } : s)) }));
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/hero", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intervalMs: cfg.intervalMs, slides: cfg.slides }),
      });
      if (!res.ok) throw new Error();
      toast.success("اسلایدر ذخیره شد");
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally { setSaving(false); }
  }

  if (loading) {
    return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری…</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="p-3 rounded-2xl bg-primary text-primary-foreground"><Images className="h-5 w-5" /></span>
        <div>
          <h1 className="text-2xl text-primary">تصاویر سربرگ (اسلایدر)</h1>
          <p className="text-sm text-muted-foreground mt-1">تا سه تصویر برای اسلایدر بخش اول صفحه اصلی. اگر خالی بماند، تصاویر پیش‌فرض نمایش داده می‌شوند.</p>
        </div>
      </div>

      <div className="grid gap-5">
        {cfg.slides.map((s, i) => (
          <div key={i} className="hg-card p-5 grid md:grid-cols-[220px_1fr] gap-5 items-start">
            <div className="rounded-2xl overflow-hidden bg-parchment border border-primary/10 h-36 flex items-center justify-center">
              {s.imageUrl
                ? <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-xs text-muted-foreground">پیش‌فرض</span>}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="chip">تصویر {i + 1}</span>
                {s.imageUrl && (
                  <button className="btn-ghost text-destructive" onClick={() => setSlide(i, { imageUrl: "" })}>
                    <Trash2 className="h-4 w-4" /> حذف تصویر
                  </button>
                )}
              </div>
              <ImageInput value={s.imageUrl} onChange={url => setSlide(i, { imageUrl: url })} />
              <label className="block">
                <span className="text-sm text-primary">متن جایگزین تصویر (alt)</span>
                <input className="hg-input mt-1" value={s.alt} onChange={e => setSlide(i, { alt: e.target.value })} placeholder="مثلاً: کلاس مکالمه بزرگسالان" />
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="hg-card p-5 mt-5 max-w-sm">
        <label className="block">
          <span className="text-sm text-primary">فاصله تعویض تصاویر (میلی‌ثانیه)</span>
          <input
            type="number" min={2000} max={30000} step={500}
            className="hg-input mt-1"
            value={cfg.intervalMs}
            onChange={e => setCfg({ ...cfg, intervalMs: Number(e.target.value) || 6000 })}
          />
        </label>
      </div>

      <div className="mt-8">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} ذخیره
        </button>
      </div>
    </div>
  );
}
