import { useEffect } from "react";
import { toJalali, jalaliTupleToIso } from "@/lib/jalali";

const FA_MONTHS = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];

function currentJy(): number {
  const now = new Date();
  return toJalali(now.getFullYear(), now.getMonth() + 1, now.getDate())[0];
}

function isoToParts(iso: string | undefined | null): { jy: number; jm: number; jd: number } {
  if (!iso) return { jy: currentJy(), jm: 1, jd: 1 };
  const [gy, gm, gd] = String(iso).slice(0, 10).split("-").map(Number);
  if (!gy || !gm || !gd) return { jy: currentJy(), jm: 1, jd: 1 };
  const [jy, jm, jd] = toJalali(gy, gm, gd);
  return { jy, jm, jd };
}

interface Props {
  value?: string; // ISO yyyy-mm-dd
  onChange: (iso: string) => void;
}

export default function JalaliDateInput({ value, onChange }: Props) {
  const parts = isoToParts(value);

  // Auto-initialize ISO value on mount if empty, so form has a valid date even without interaction.
  useEffect(() => {
    if (!value) {
      try { onChange(jalaliTupleToIso(parts.jy, parts.jm, parts.jd)); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(next: { jy?: number; jm?: number; jd?: number }) {
    const jy = next.jy ?? parts.jy;
    const jm = next.jm ?? parts.jm;
    const jd = Math.max(1, Math.min(31, next.jd ?? parts.jd));
    try {
      onChange(jalaliTupleToIso(jy, jm, jd));
    } catch {
      // ignore invalid combos
    }
  }

  const cls = "rounded-lg bg-parchment border border-primary/15 px-2 py-2 text-sm text-center";

  return (
    <div className="flex gap-2" dir="rtl">
      <input
        type="number" min={1} max={31}
        value={parts.jd}
        onChange={e => set({ jd: +e.target.value })}
        className={`${cls} w-16`}
        placeholder="روز"
      />
      <select
        value={parts.jm}
        onChange={e => set({ jm: +e.target.value })}
        className={`${cls} flex-1`}
      >
        {FA_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>
      <input
        type="number" min={1300} max={1500}
        value={parts.jy}
        onChange={e => set({ jy: +e.target.value })}
        className={`${cls} w-20`}
        placeholder="سال"
      />
    </div>
  );
}
