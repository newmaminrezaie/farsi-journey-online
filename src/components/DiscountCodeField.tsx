import { useState } from "react";
import { toast } from "sonner";
import { BadgePercent, Loader2, X, Check } from "lucide-react";
import { discountsApi, formatToman } from "@/lib/api";

interface Props {
  scope: "registration" | "shop";
  amountToman: number;
  /** Fires whenever the applied code changes (empty string = removed). */
  onApply: (code: string, discountToman: number) => void;
  className?: string;
}

/** ورودی کد تخفیف — اعتبارسنجی آنی از سمت سرور. */
export default function DiscountCodeField({ scope, amountToman, onApply, className = "" }: Props) {
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; percent: number; discountToman: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  async function apply() {
    const c = code.trim();
    if (!c) { setError("کد تخفیف را وارد کنید."); return; }
    setChecking(true);
    setError("");
    try {
      const res = await discountsApi.validate(c, scope, amountToman);
      if (!res.valid) {
        setError(res.messageFa || "کد تخفیف نامعتبر است.");
        setApplied(null);
        onApply("", 0);
        return;
      }
      setApplied({ code: res.code!, percent: res.percent!, discountToman: res.discountToman! });
      onApply(res.code!, res.discountToman!);
      toast.success(`کد تخفیف ${res.code} اعمال شد`);
    } catch {
      setError("بررسی کد تخفیف ممکن نشد.");
    } finally {
      setChecking(false);
    }
  }

  function clear() {
    setApplied(null);
    setCode("");
    setError("");
    onApply("", 0);
  }

  return (
    <div className={`rounded-2xl border border-primary/10 bg-card p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3 text-primary font-bold text-sm">
        <BadgePercent className="h-4 w-4 text-gold" /> کد تخفیف دارید؟
      </div>

      {applied ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-turquoise/10 border border-turquoise/30 px-4 py-3">
          <div className="text-sm">
            <span className="font-black text-primary flex items-center gap-1.5">
              <Check className="h-4 w-4 text-turquoise" /> {applied.code}
            </span>
            <span className="text-xs text-muted-foreground">
              {applied.percent.toLocaleString("fa-IR")}٪ تخفیف — {formatToman(applied.discountToman)}
            </span>
          </div>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-destructive" aria-label="حذف کد تخفیف">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            value={code}
            onChange={e => { setCode(e.target.value); setError(""); }}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); apply(); } }}
            placeholder="مثلاً NOWRUZ1405"
            className="hg-input flex-1 tracking-widest"
            dir="ltr"
          />
          <button type="button" onClick={apply} disabled={checking} className="btn-primary shrink-0 !px-5">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعمال"}
          </button>
        </div>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  );
}
